import React, { useEffect, useState } from "react";
import 'bootstrap/dist/css/bootstrap.css';
import "./App.css";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import QRCode from "react-qr-code";
import Button from "react-bootstrap/Button";
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import { ethers } from "ethers";
import { hexlify } from "@ethersproject/bytes";
import { AsnParser } from '@peculiar/asn1-schema';
import base64url from "base64url";
import { ECDSASigValue } from '@peculiar/asn1-ecc';

const abi = [
  "constructor(address bonsaiRelay, bytes32 _fibImageId, uint256[2] _publicKey)",
  "function send(bool verify_result, address _to, uint256 value)",
  "function verifyAndSend(address _to, bytes auth_data, uint256 value)"
];

function App(this: any) {
  const [loaded, setLoaded] = useState(false);
  const [show, setShow] = useState(false);
  const [receiver, setReceiver] = useState("");
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(new ethers.BrowserProvider(window.ethereum));
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState("");

  const handleClosePopup = () => setShow(false);
  const handleShowPopup = () => setShow(true);

  // Sets receiver for transferring funds
  const handleReceiverChange = (event: any) => {
    console.log(event);
    setReceiver(event.target.value);
  };

  useEffect(() => {
    setTimeout(() => {
      setLoaded(true);
    }, 200)

    // Simple call from server to check whether it's live.
    fetch("/live")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.text();
      })
      .then((text) => {
        const data = JSON.parse(text);
        console.log(data.message);
      })
      .catch((err) => {
        console.error("Error checking live status of server:", err);
      });

    getBalances();
  }, [])

  async function getBalances() {
    if(provider == null || contractAddress == null) {
      return;
    }
    const balance = await provider.getBalance(contractAddress);
    console.log(balance);
    setBalance(balance.toString());
  }

  // Create Burner Wallet, by registering on WebAuthn
  async function btnRegBegin() {
    fetch("/generate-registration-options")
      .then(async (res) => {
        const resp = await fetch('/generate-registration-options');

        let attResp;
        try {
          const opts = await resp.json();
          attResp = await startRegistration(opts);
        } catch (error) {
          throw error;
        }

        const verificationResp = await fetch('/verify-registration', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(attResp),
        });

        const verificationJSON = await verificationResp.json();
        console.log(verificationJSON);

        if (verificationJSON && verificationJSON.verified) {
          console.log("Registration successful");

          // Extracting public key from COSE_Key-encoded ecc key
          // https://www.w3.org/TR/2021/REC-webauthn-2-20210408/ section 6.5.1.1
          let pubkey_x: any[] = [];
          let pubkey_y: any[] = [];
          for (let i = 10; i < 42; i++) {
            pubkey_x.push(verificationJSON.pubkey[i]);
          }
          for (let i = 45; i < 77; i++) {
            pubkey_y.push(verificationJSON.pubkey[i]);
          }
          if (provider === null) {
            console.log('Provider not found, this is needed to instantiate Burner wallet...');
            return;
          }
      
          const signer = provider.getSigner();
          signer.then((signer) => {
            setSigner(signer);
            // TODO: this is ERC20 bytecode now so this must be replaced with bytecode for wallet contract.
            const bytecode = "0x60c060405234801561001057600080fd5b5060405161080c38038061080c83398101604081905261002f916100d3565b6001600160a01b03831660805260a082905261004e600082600261006a565b5050600280546001600160a01b031916331790555061017c9050565b8260028101928215610098579160200282015b8281111561009857825182559160200191906001019061007d565b506100a49291506100a8565b5090565b5b808211156100a457600081556001016100a9565b634e487b7160e01b600052604160045260246000fd5b6000806000608084860312156100e857600080fd5b83516001600160a01b03811681146100ff57600080fd5b80935050602080850151925085605f86011261011a57600080fd5b604080519081016001600160401b038111828210171561013c5761013c6100bd565b60405280608087018881111561015157600080fd5b604088015b8181101561016d5780518352918401918401610156565b50505080925050509250925092565b60805160a0516106496101c360003960008181608e01528181610151015261024f01526000818161010d015281816102200152818161030a015261034701526106496000f3fe60806040526004361061004e5760003560e01c8063041507c51461005a57806313234edc1461007c5780638da5cb5b146100c3578063e70ffd4b146100fb578063f885dd8f1461012f57600080fd5b3661005557005b600080fd5b34801561006657600080fd5b5061007a6100753660046103ee565b61014f565b005b34801561008857600080fd5b506100b07f000000000000000000000000000000000000000000000000000000000000000081565b6040519081526020015b60405180910390f35b3480156100cf57600080fd5b506002546100e3906001600160a01b031681565b6040516001600160a01b0390911681526020016100ba565b34801561010757600080fd5b506100e37f000000000000000000000000000000000000000000000000000000000000000081565b34801561013b57600080fd5b5061007a61014a366004610431565b61021e565b7f00000000000000000000000000000000000000000000000000000000000000006101786102ff565b6101818161037f565b836101c05760405162461bcd60e51b815260206004820152600a60248201526914da59c819985a5b195960b21b60448201526064015b60405180910390fd5b600080846001600160a01b03168460405160006040518083038185875af1925050503d806000811461020e576040519150601f19603f3d011682016040523d82523d6000602084013e610213565b606091505b505050505050505050565b7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031663e80802a27f00000000000000000000000000000000000000000000000000000000000000006000878787876040516020016102889594939291906104ba565b60408051601f19818403018152908290526001600160e01b031960e085901b1682526102c79291309063041507c560e01b90620186a090600401610514565b600060405180830381600087803b1580156102e157600080fd5b505af11580156102f5573d6000803e3d6000fd5b5050505050505050565b336001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016811461037c5760405163432e033760e11b81526001600160a01b037f000000000000000000000000000000000000000000000000000000000000000081166004830152821660248201526044016101b7565b50565b6000803661038e6020826105a4565b6103999282906105cb565b6103a2916105f5565b90508082146103ce57604051630be5472b60e41b815260048101839052602481018290526044016101b7565b5050565b80356001600160a01b03811681146103e957600080fd5b919050565b60008060006060848603121561040357600080fd5b8335801515811461041357600080fd5b9250610421602085016103d2565b9150604084013590509250925092565b6000806000806060858703121561044757600080fd5b610450856103d2565b9350602085013567ffffffffffffffff8082111561046d57600080fd5b818701915087601f83011261048157600080fd5b81358181111561049057600080fd5b8860208285010111156104a257600080fd5b95986020929092019750949560400135945092505050565b60008187825b60028110156104df5781548352602090920191600191820191016104c0565b5050506bffffffffffffffffffffffff198660601b166040830152838560548401375060549201918201526074019392505050565b8581526000602060a08184015286518060a085015260005b818110156105485788810183015185820160c00152820161052c565b50600060c08286018101919091526001600160a01b03881660408601526001600160e01b031987166060860152601f909101601f1916840101915061058a9050565b67ffffffffffffffff831660808301529695505050505050565b818103818111156105c557634e487b7160e01b600052601160045260246000fd5b92915050565b600080858511156105db57600080fd5b838611156105e857600080fd5b5050820193919092039150565b803560208310156105c557600019602084900360031b1b169291505056fea2646970667358221220050f3c5016f6a76d5c9155050e773d0dba5b2124cc0b51c573f7efddff77cbc464736f6c63430008140033";
            const factory = new ethers.ContractFactory(abi, bytecode, signer);
            // TODO: this image id is for fibonacci
            const imageId = "0xee32dd84d935ed8db5221232ab389d77b1e07bde85db192d31fcc673bfd0726f";
            const relayAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
            console.log("3");
            factory.deploy(relayAddress, imageId, [hexlify(pubkey_x), hexlify(pubkey_y)]).then((contract) => {
              console.log("deploy started...");
              return contract.waitForDeployment();
            }).then((result) => {
              console.log("deploy completed. Getting address...");
              return result.getAddress();
            }).then((address) => {
              console.log(address);
              setContractAddress(address);
              return getBalances();
            }).then(() => {
              console.log("Updated balances.");
            });
          });

        } else {
          console.error("Registration failed");
        }
    
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
      }); 
  }

  function removeFirstIfNeeded(byteArray: Uint8Array): Uint8Array {
    if (byteArray.byteLength == 33) {
      return byteArray.slice(1);
    } else {
      return byteArray.slice(0);
    }
  }

  // Authenticate a transaction, by authenticating with WebAuthn
  async function btnAuthBegin() {
    setShow(false);
    console.log('Sending funds to:', receiver);

    const resp = await fetch('/generate-authentication-options');

    let asseResp;
    try {
      const opts = await resp.json();

      asseResp = await startAuthentication(opts);
    } catch (error) {
      throw error;
    }

    const verificationResp = await fetch('/verify-authentication', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(asseResp),
    });

    const authResponse = await verificationResp.json();
    console.log(authResponse);
    if (authResponse.verified) {
      console.log("Authentication successful");
    } else {
      console.error("Authentication failed");
    }

    setReceiver("");
    global.Buffer = global.Buffer || require('buffer').Buffer;

    const parsedSignature = AsnParser.parse(
      base64url.toBuffer(asseResp.response.signature),
      ECDSASigValue,
    ); 

    //parsing the signature 
    let r = new Uint8Array(parsedSignature.r);
    let s = new Uint8Array(parsedSignature.s);
    let rr = removeFirstIfNeeded(r);
    let ss = removeFirstIfNeeded(s);

    let authData = [];

    for (let i = 0; i < 32; i++) {
      authData.push(authResponse.hashedSignatureBase[i]);
    }
    for (let i = 0; i < 32; i++) {
      authData.push(rr[i]);
    }
    for (let i = 0; i < 32; i++) {
      authData.push(ss[i]);
    }
    console.log(authData);

    if(contractAddress == null || signer == null) {
      return;
    }

    const value = 1;
    const contract = new ethers.Contract(contractAddress, abi, signer);

    contract.verifyAndSend(receiver, hexlify(authData), value)
      .then((f) => {
        console.log("successfully send transaction",f);
      }).catch((err) => {
        console.error("Error Sending transaction:", err);
      });
  }


  if (contractAddress)   return (
    <>
      <div style={wallet_page} className="m-0 p-0 container-xxl text-center" >

        <div className="row justify-content-center pt-5">
          <div className="col-4">
            <div className="card p-3" style={wallet_card}>
            <div className="card-header">
              <h2>Your Bonfire Address</h2>
            </div>
              <div className="card-body">
                
              <QRCode
                size={256}
                style={{ height: "auto", maxWidth: "100%", width: "100%"}}
                value={contractAddress || "uninitialized"} //TODO this needs to be the address
                viewBox={`0 0 256 256`}
                /><br></br>
                <p className="pt-3">{contractAddress}</p>
              </div>

              <p>Current balance: {balance}</p>

              <Button style={buttonCreateStyle}  onClick={handleShowPopup}>
              Send funds
              </Button>

              <Modal show={show} onHide={handleClosePopup}>
                <Modal.Header closeButton>
                  <Modal.Title>Transfer</Modal.Title>
                </Modal.Header>
                <Modal.Body>

                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Receiver Address</Form.Label>
                    <br></br>
                    <input
                      type="text"
                      name="receiver"
                      value={receiver}
                      onChange={handleReceiverChange}
                      style={receiverInput}
                    />

                  </Form.Group>
                </Form>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={handleClosePopup}>
                    Close
                  </Button>
                  <Button style={orangeButton} onClick={btnAuthBegin}>
                    Send funds
                  </Button>
                </Modal.Footer>
              </Modal>
            </div>
          
          </div>
        </div>
        </div>

      
    </>
  );
  
  return (
    <>
      <div style={register_page} className="m-0 p-0 container-xxl text-center" >
        
        <div className="row justify-content-center">
          <div className="col-4">
          <img className="img-fluid mx-auto d-block" src="./bonfire.png"></img>
          </div>
        </div>

        <div className="row justify-content-center">
          <div className="col-4">
          <button style={buttonCreateStyle} onClick={btnRegBegin}>
              Create Bonfire Wallet
              </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;

const orangeButton = {
  backgroundColor: "#FF6F00",
  border: "none",
}

const buttonCreateStyle = {
  borderRadius: "10px",
  marginTop: "10px",
  backgroundColor: "#FF6F00",
  fontSize: "20px",
  fontWeight: "600",
  color: "rgba(0, 0, 0, .88)",
  border: "none",
  outline: "none",
  height: "60px",
  cursor: "pointer"
}

const buttonSendFundsStyle = {
  borderRadius: "10px",
  marginTop: "10px",
  backgroundColor: "#FF6F00",
  fontSize: "18px",
  fontWeight: "600",
  color: "rgba(0, 0, 0, .88)",
  border: "none",
  outline: "none",
  height: "40px",
  cursor: "pointer"
}

const receiverInput = {
  width: "100%"
}

// Full height, dark background
const register_page = {
  backgroundColor: "#0B0B0B",
  height: "100vh",
  maxWidth: "100%", 
  width: "100%"
}

const wallet_page = {
  backgroundColor: "#0B0B0B",
  height: "100vh",
  maxWidth: "100%", 
  width: "100%"
}

const wallet_card = {
  backgroundColor: "#FF8500",
}

const balance_card = {
  backgroundColor: "#333333",
  height: "100vh",
  color: "white"
}

// Dark Charcoal: #333333
// Burnt Orange: #FF6F00
// Jet Black: #000000
// Rust: #D65108
// Midnight Black: #0B0B0B
// Pumpkin: #FF8500
