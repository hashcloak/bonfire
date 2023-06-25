# Bonfire Wallet

Passwordless disposable wallet. 

# Build & Run

## Local Relay (RISC-Zero)

For this project, it is necessary to run a local relayer for RISC-Zero as described [here](https://github.com/risc0/bonsai-foundry-template/pull/16) (follow step 1, 2, 3). 

*Make sure to clear the cache of MetaMask in between.*

The necessary steps are repeated here for completeness:

### 0. Checkout the local relayer 

Clone the `bonsai-foundry-template` for the correct branch, that contains the local relay.
```
git clone https://github.com/risc0/bonsai-foundry-template/tree/rkhalil/open-relay
```

### 1. Start an anvil instance

```
anvil
```

### 2. Run the provided deploy script to deploy the local relay and the starter contract

```
RELAY_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 forge script script/Deploy.s.sol:Deploy --rpc-url http://localhost:8545 --broadcast
```

### 3. Run the local relay binary

```
cargo run relay --relay-contract-address 0x5fbdb2315678afecb367f032d93f642f64180aa3 --eth-node-url ws://localhost:8545 --private-key ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

This does not "finish"; it runs until you stop it or the `anvil` instance is stopped. 

This deploy script also deploys the Fibonacci example contract. For this burner wallet example that is not necessary, but it is no problem to run it either. 

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
