# Frontend connecting to WebAuthn


## Build & Run

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

- Create Bonfire Wallet: this will trigger webauthn to ask for registration, for example using fingerprint. If successful, a message is printed to console.
- Send funds: this will trigger webauthn authentication, this can be done again with for example fingerprint. If successful, a message is printed to console.