# Frontend connecting to WebAuthn


## Build & Run

This should run on a local blockchain, spun up with `anvil`. This runs on `127.0.0.1:8545`. 

Creating the Burner Wallet requires MetaMask in the browser. This should be set to localhost and additionally, in the Settings, the chainId must be set to `31337`. 

Using `anvil`, you are provided multiple test wallets with funds. Import a test wallet in MetaMask for testing purposes, using one of the private keys that `anvil` prints. 

### WebAuthn Server

Example code: https://github.com/MasterKale/SimpleWebAuthn/tree/master/example

This server code expects the frontend to run on port 3000. If this is not the case, change the hardcoded `expectedOrigin` in `server/src/index.ts`. 

```
npm install
npm start
```

### Wallet Frontend

The WebAuthn server must be running on 127.0.0.1:8000, if it is somewhere else, this has to be adjusted in `frontend/package.json`, specifically `"proxy": "http://127.0.0.1:8000"`. 

Open the console in the Developer Tools to see additional messages. 

```
npm install
npm start
```

## Expected functionality

### Create Bonfire Wallet

Creating a new wallet triggers registration with WebAuthn. If this is completed successfully, MetaMask is triggered to connect. Make sure the network is set to `localhost:8545`. Confirm transaction.

TODO: transaction should call the smart contract that creates the Burner Wallet. From this we can obtain the address. This must be set in the frontend. 

### Wallet

Clicking on Send funds triggers authentication with WebAuthn. 

TODO:
- QR code should contains address
- Show balances of burner wallet
- After completing WebAuthn authentication, the app should call the smart contract that does verification