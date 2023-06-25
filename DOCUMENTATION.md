# Description of project

The Bonfire Wallet is a simple web application that allows users to create a burner wallet using WebAuthn. This means a fingerprint (biometrics), or a token such as a yubikey can be used for wallet creation. There is no seed or private key for the user to store, they can just authenticate through the same way after creating the wallet. 

The wallet is built on RISC-Zero, which makes it possible to offload the heavy computation, instead of doing this on chain. The computation in this case is the verification of the signature that WebAuthn provides after authenticating. RISC-Zero makes this possible through their general purpose zero-knowledge VM, which is leverageble at the moment through their Bonsai proving service. 

There are 2 main parts to the application: the (frontend) web wallet and the Solidity contract that offloads computation to the Bonsai proving service. 

## Frontend 
In the frontend WebAuthn is integrated in 2 ways: upon wallet creation the user is asked to register through WebAuthn in the browser (the browser must support this). The user can choose this to be for example fingerprint, a physical token such as a yubikey or a bluetooth connected device. WebAuthn will generate a public key for the user and is used int he Bonfire Wallet to instantiate the burner wallet. The second part where WebAuthn comes into play is when the user wants to send funds to another wallet: this will be authorized using WebAuthn authentication. The user is asked to authenticate in the same way that they registered and this will generate a signature through with WebAuthn. WebAuthn uses p256 which is specifially secp256r1 (not to be confused with secp256k1 of Bitcoin).

## Smart Contract
The other main part of the application is the smart contract that is deployed for each new burner wallet. The smart contract contains the public key that uniquely identifies the burner wallet and is generated through WebAuthn. Apart from construction there is one other main functionality of the smart contract: verify-and-send. This receives a WebAuthn signature that has to be verified in order to execute the transaction. Verification of the signature is computationally heavy, therefore this is offloaded to the Bonsai proving service. To leverage Bonsai, a zkVM guest program is written in Rust that does verification of the p256 signature. A proof of execution is generated and returned to the smart contract. 

## Wallet usage
A user can easily create a new burner wallet following the instructions from WebAuthn. After a public key has been generated through WebAuth, MetaMask is needed to deploy the smart contract that instantiates the burner wallet. When successful, the user is provided with an address and can receive and send funds. When funds are sent by the user, authentication through WebAuthn is needed and requested in the same way as for registration. Again, MetaMask will be needed to confirm the transaction.


## Future
With ERC4337 MetaMask could be eliminated from the current flow of the wallet. A user wouldn't need to already have a wallet to create a burner wallet, which would make it much more accessible. 
Also, if another standardized WebAuthn-like scheme is presented that uses a different signature scheme, this could be easily adopted, because any heavy computation can be offloaded using RISC-Zero. 