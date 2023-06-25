# Bonfire Wallet

Bonfire Wallet is a passwordless burner wallet that leverages WebAuthn to onboard the next 1 million crypto users, with biometrics or a token for authentication, making it accesible to anyone entering the crypto ecosystem. Using RISC-Zero, heavy verification computation can be offloaded through verifiable computation. 

# Build & Run

## Local Relay (RISC-Zero)

For this project, it is necessary to run a local relayer for RISC-Zero as described [here](https://github.com/risc0/bonsai-foundry-template/pull/16) (step 1, 2, 3). This was added to this codebase for completeness.

*Make sure to clear the cache of MetaMask in between.*


### 1. Start an anvil instance

```
anvil
```

### 2. Deploy the local relay contract

```
cd my-project
RELAY_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 forge script script/Deploy.s.sol:Deploy --rpc-url http://localhost:8545 --broadcast
```

### 3. Run the local relay binary

```
cargo run relay --relay-contract-address 0x5fbdb2315678afecb367f032d93f642f64180aa3 --eth-node-url ws://localhost:8545 --private-key ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

This does not "finish"; it runs until you stop it or the `anvil` instance is stopped. 

### Note!

When interaction also with MetaMask, make sure to clean the cache in between to ensure a clean slate. 

### WebApp

This wallet can be run in a browser with MetaMask. All previous steps must have been completed before running 

### 1. WebAuthn Server

Example code: https://github.com/MasterKale/SimpleWebAuthn/tree/master/example

This server code expects the frontend to run on port 3000. If this is not the case, change the hardcoded `expectedOrigin` in `server/src/index.ts`. 

```
npm install
npm start
```

### 2. Wallet Frontend

The WebAuthn server must be running on 127.0.0.1:8000, if it is somewhere else, this has to be adjusted in `frontend/package.json`, specifically `"proxy": "http://127.0.0.1:8000"`. 

Open the console in the Developer Tools to see additional messages. 

```
npm install
npm start
```

# Resources

Bonsai Foundry template using local relay: https://github.com/risc0/bonsai-foundry-template/pull/16

WebAuthn Example code: https://github.com/MasterKale/SimpleWebAuthn/tree/master/example

