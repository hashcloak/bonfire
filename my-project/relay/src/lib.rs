// Copyright 2023 RISC Zero, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

use std::{env, sync::Arc, time::Duration};

use anyhow::{anyhow, bail, Context, Result};
use bonsai_sdk_alpha::alpha::Client;
use bonsai_starter_methods::GUEST_LIST;
use ethers::{
    core::{
        k256::{ecdsa::SigningKey, SecretKey},
        types::Address,
    },
    middleware::SignerMiddleware,
    prelude::*,
    providers::{Provider, Ws},
};
use risc0_build::GuestListEntry;
use risc0_zkvm::{recursion::SessionRollupReceipt, Executor, ExecutorEnv};

/// Execute and prove the guest locally, on this machine, as opposed to sending
/// the proof request to the Bonsai service.
pub fn prove_locally(elf: &[u8], input: Vec<u8>, prove: bool) -> Result<Vec<u8>> {
    // Execute the guest program, generating the session trace needed to prove the
    // computation.
    let env = ExecutorEnv::builder().add_input(&input).build();
    let mut exec = Executor::from_elf(env, elf).context("Failed to instantiate executor")?;
    let session = exec
        .run()
        .context(format!("Failed to run executor {:?}", &input))?;

    // Locally prove resulting journal
    if prove {
        session.prove().context("Failed to prove session")?;
        // eprintln!("Completed proof locally");
    } else {
        // eprintln!("Completed execution without a proof locally");
    }
    Ok(session.journal)
}

pub const POLL_INTERVAL_SEC: u64 = 4;

pub fn prove_alpha(elf: &[u8], input: Vec<u8>) -> Result<Vec<u8>> {
    let client = Client::from_env().context("Failed to create client from env var")?;

    let img_id = client
        .upload_img(elf.to_vec())
        .context("Failed to upload ELF image")?;

    let input_id = client
        .upload_input(input)
        .context("Failed to upload input data")?;

    let session = client
        .create_session(img_id, input_id)
        .context("Failed to create remote proving session")?;

    loop {
        let res = match session.status(&client) {
            Ok(res) => res,
            Err(err) => {
                eprint!("Failed to get session status: {err}");
                std::thread::sleep(Duration::from_secs(POLL_INTERVAL_SEC));
                continue;
            }
        };
        match res.status.as_str() {
            "RUNNING" => {
                std::thread::sleep(Duration::from_secs(POLL_INTERVAL_SEC));
            }
            "SUCCEEDED" => {
                let receipt_buf = client
                    .download(
                        &res.receipt_url
                            .context("Missing 'receipt_url' on status response")?,
                    )
                    .context("Failed to download receipt")?;
                let receipt: SessionRollupReceipt = bincode::deserialize(&receipt_buf)
                    .context("Failed to deserialize SessionRollupReceipt")?;
                // eprintln!("Completed proof on bonsai alpha backend!");
                return Ok(receipt.journal);
            }
            _ => {
                bail!("Proving session exited with bad status: {}", res.status);
            }
        }
    }
}

pub fn resolve_guest_entry<'a>(
    guest_list: &'a [GuestListEntry],
    guest_binary: &String,
) -> Result<&'a GuestListEntry> {
    // Search list for requested binary name
    let potential_guest_image_id: [u8; 32] =
        match hex::decode(guest_binary.to_lowercase().trim_start_matches("0x")) {
            Ok(byte_vector) => byte_vector.try_into().unwrap_or([0u8; 32]),
            Err(_) => [0u8; 32],
        };
    guest_list
        .iter()
        .find(|entry| {
            entry.name == guest_binary.to_uppercase()
                || bytemuck::cast::<[u32; 8], [u8; 32]>(entry.image_id) == potential_guest_image_id
        })
        .ok_or_else(|| {
            let found_guests: Vec<String> = guest_list
                .iter()
                .map(|g| hex::encode(bytemuck::cast::<[u32; 8], [u8; 32]>(g.image_id)))
                .collect();
            anyhow!(
                "Unknown guest binary {}, found: {:?}",
                guest_binary,
                found_guests
            )
        })
}

pub async fn resolve_image_output(input: &String, guest_entry: &GuestListEntry) -> Result<Vec<u8>> {
    let input = hex::decode(input.trim_start_matches("0x")).context("Failed to decode input")?;
    let prover = env::var("BONSAI_PROVING").unwrap_or("".to_string());
    let elf = guest_entry.elf.clone();

    match prover.as_str() {
        "bonsai" => tokio::task::spawn_blocking(move || prove_alpha(elf, input))
            .await
            .expect("Failed to run alpha sub-task"),
        "local" => prove_locally(elf, input, true),
        _ => prove_locally(elf, input, false),
    }
}

abigen!(ProxyContract, "artifacts/proxy.sol/Proxy.json");

pub struct Config {
    pub proxy_address: Address,
}

pub async fn run_with_ethers_client<M: Middleware + 'static>(config: Config, ethers_client: Arc<M>)
where
    <M as ethers::providers::Middleware>::Provider: PubsubClient,
    <<M as ethers::providers::Middleware>::Provider as ethers::providers::PubsubClient>::NotificationStream: Sync,
{
    let event_name = "CallbackRequest(address,bytes32,bytes,address,bytes4,uint64)";
    let filter = ethers::types::Filter::new()
        .address(config.proxy_address)
        .event(event_name);
    let mut proxy_stream = ethers_client
        .subscribe_logs(&filter)
        .await
        .unwrap()
        .map(|log| {
            ethers::contract::parse_log::<CallbackRequestFilter>(log)
                .expect("must be a callback proof request log")
        });

    let proxy: ProxyContract<M> = ProxyContract::new(config.proxy_address, ethers_client.clone());
    while let Some(event) = proxy_stream.next().await {
        // Search list for requested binary name
        let image_id = hex::encode(event.image_id);
        let guest_entry =
            resolve_guest_entry(GUEST_LIST, &image_id).expect("Failed to resolve guest entry");

        // Execute or return image id
        let input = hex::encode(event.input);
        let journal_bytes: Vec<u8> = resolve_image_output(&input, guest_entry)
            .await
            .expect("Failed to compute journal output")
            .into();

        let payload = [
            event.function_selector.as_slice(),
            journal_bytes.as_slice(),
            event.image_id.as_slice(),
        ]
        .concat();

        // Broadcast callback transaction
        let proof_batch: Vec<Callback> = vec![Callback {
            callback_contract: event.callback_contract,
            journal_inclusion_proof: vec![],
            payload: payload.into(),
            gas_limit: event.gas_limit,
        }];

        proxy
            .invoke_callbacks(proof_batch)
            .send()
            .await
            .expect("failed to send callback transaction")
            .await
            .expect("Failed to confirm callback transaction");
    }
}

pub async fn create_ethers_client_private_key(
    eth_node_url: &str,
    private_key: &str,
    eth_chain_id: u64,
) -> Arc<SignerMiddleware<Provider<Ws>, LocalWallet>> {
    let web3_provider = Provider::<Ws>::connect(eth_node_url)
        .await
        .expect("unable to connect to websocket");
    let web3_wallet_sk_bytes =
        hex::decode(private_key).expect("private_key should be valid hex string");
    let web3_wallet_secret_key =
        SecretKey::from_slice(&web3_wallet_sk_bytes).expect("invalid private key");
    let web3_wallet_signing_key = SigningKey::from(web3_wallet_secret_key);
    let web3_wallet = LocalWallet::from(web3_wallet_signing_key);
    Arc::new(SignerMiddleware::new(
        web3_provider,
        web3_wallet.with_chain_id(eth_chain_id),
    ))
}
