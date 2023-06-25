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
            const bytecode = "0x60c060405234801561001057600080fd5b506040516108ff3803806108ff83398101604081905261002f916100d3565b6001600160a01b03831660805260a082905261004e600082600261006a565b5050600280546001600160a01b031916331790555061017c9050565b8260028101928215610098579160200282015b8281111561009857825182559160200191906001019061007d565b506100a49291506100a8565b5090565b5b808211156100a457600081556001016100a9565b634e487b7160e01b600052604160045260246000fd5b6000806000608084860312156100e857600080fd5b83516001600160a01b03811681146100ff57600080fd5b80935050602080850151925085605f86011261011a57600080fd5b604080519081016001600160401b038111828210171561013c5761013c6100bd565b60405280608087018881111561015157600080fd5b604088015b8181101561016d5780518352918401918401610156565b50505080925050509250925092565b60805160a05161073c6101c36000396000818160d60152818161017c015261034401526000818161013801528181610315015281816103ff015261043c015261073c6000f3fe6080604052600436106100595760003560e01c8063041507c514610065578063131519811461008757806313234edc146100c45780638da5cb5b14610106578063e70ffd4b14610126578063f885dd8f1461015a57600080fd5b3661006057005b600080fd5b34801561007157600080fd5b506100856100803660046104dc565b61017a565b005b34801561009357600080fd5b506003546100a7906001600160a01b031681565b6040516001600160a01b0390911681526020015b60405180910390f35b3480156100d057600080fd5b506100f87f000000000000000000000000000000000000000000000000000000000000000081565b6040519081526020016100bb565b34801561011257600080fd5b506002546100a7906001600160a01b031681565b34801561013257600080fd5b506100a77f000000000000000000000000000000000000000000000000000000000000000081565b34801561016657600080fd5b50610085610175366004610522565b6102ec565b7f00000000000000000000000000000000000000000000000000000000000000006101a36103f4565b6101ac81610474565b6003546001600160a01b0384811691161461020e5760405162461bcd60e51b815260206004820152601860248201527f52656365697665722041646472657373206368616e676564000000000000000060448201526064015b60405180910390fd5b836102485760405162461bcd60e51b815260206004820152600a60248201526914da59c819985a5b195960b21b6044820152606401610205565b600080846001600160a01b03168460405160006040518083038185875af1925050503d8060008114610296576040519150601f19603f3d011682016040523d82523d6000602084013e61029b565b606091505b5091509150816102e45760405162461bcd60e51b81526020600482015260146024820152732330b4b632b2103a379039b2b7321022ba3432b960611b6044820152606401610205565b505050505050565b83600360006101000a8154816001600160a01b0302191690836001600160a01b031602179055507f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031663e80802a27f000000000000000000000000000000000000000000000000000000000000000060008787878760405160200161037d9594939291906105ad565b60408051601f19818403018152908290526001600160e01b031960e085901b1682526103bc9291309063041507c560e01b90620186a090600401610607565b600060405180830381600087803b1580156103d657600080fd5b505af11580156103ea573d6000803e3d6000fd5b5050505050505050565b336001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001681146104715760405163432e033760e11b81526001600160a01b037f00000000000000000000000000000000000000000000000000000000000000008116600483015282166024820152604401610205565b50565b60008036610483602082610697565b61048e9282906106be565b610497916106e8565b90508082146104c357604051630be5472b60e41b81526004810183905260248101829052604401610205565b5050565b6001600160a01b038116811461047157600080fd5b6000806000606084860312156104f157600080fd5b8335801515811461050157600080fd5b92506020840135610511816104c7565b929592945050506040919091013590565b6000806000806060858703121561053857600080fd5b8435610543816104c7565b9350602085013567ffffffffffffffff8082111561056057600080fd5b818701915087601f83011261057457600080fd5b81358181111561058357600080fd5b88602082850101111561059557600080fd5b95986020929092019750949560400135945092505050565b60008187825b60028110156105d25781548352602090920191600191820191016105b3565b5050506bffffffffffffffffffffffff198660601b166040830152838560548401375060549201918201526074019392505050565b8581526000602060a08184015286518060a085015260005b8181101561063b5788810183015185820160c00152820161061f565b50600060c08286018101919091526001600160a01b03881660408601526001600160e01b031987166060860152601f909101601f1916840101915061067d9050565b67ffffffffffffffff831660808301529695505050505050565b818103818111156106b857634e487b7160e01b600052601160045260246000fd5b92915050565b600080858511156106ce57600080fd5b838611156106db57600080fd5b5050820193919092039150565b803560208310156106b857600019602084900360031b1b169291505056fea2646970667358221220dea69aa40a6abce2b0b97f1997fb14a855d7d3674405adc892d080243ab4326d64736f6c63430008140033";
            const factory = new ethers.ContractFactory(abi, bytecode, signer);
            // TODO: this image id is for fibonacci
            const imageId = "0x6443d7e2f1251c83d2a1be0bcce479cc4753eb9eea86c811101310df11b99b2b";
            const relayAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
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

  // Helper functions from @simplewebauthn/server
  function shouldRemoveLeadingZero(bytes: Uint8Array): boolean {
    return bytes[0] === 0x0 && (bytes[1] & (1 << 7)) !== 0;
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

    global.Buffer = global.Buffer || require('buffer').Buffer;

    // Retrieving the r and s values, see https://github.com/MasterKale/SimpleWebAuthn/blob/6f363aa53a69cf8c1ea69664924c1e9f8e19dc4e/packages/server/src/helpers/iso/isoCrypto/verifyEC2.ts#L103
    const parsedSignature = AsnParser.parse(
      base64url.toBuffer(asseResp.response.signature),
      ECDSASigValue,
    );
    let rBytes = new Uint8Array(parsedSignature.r);
    let sBytes = new Uint8Array(parsedSignature.s);

    console.log(asseResp.response.signature);
    console.log(rBytes);
    console.log(sBytes);

    if (shouldRemoveLeadingZero(rBytes)) {
      rBytes = rBytes.slice(1);
    }

    if (shouldRemoveLeadingZero(sBytes)) {
      sBytes = sBytes.slice(1);
    }

    let authData = [];

    for (let i = 0; i < 32; i++) {
      authData.push(authResponse.hashedSignatureBase[i]);
    }
    for (let i = 0; i < 32; i++) {
      authData.push(rBytes[i]);
    }
    for (let i = 0; i < 32; i++) {
      authData.push(sBytes[i]);
    }
    console.log(authData);

    if(contractAddress == null || signer == null) {
      return;
    }

    const value = 1000;
    const contract = new ethers.Contract(contractAddress, abi, signer);

    contract.verifyAndSend(receiver, hexlify(authData), value)
      .then((f) => {
        console.log("successfully send transaction",f);
        setReceiver("");
      }).catch((err) => {
        console.error("Error Sending transaction:", err);
      });
  }

  const checkBalance = () => {
    if (contractAddress === null) {
      console.log('contract address not found');
      return;
    }
    // TODO: check the result of money transfer
    if (provider === null) { return }
    provider.getBalance(contractAddress)
      .then((result) => {
        setBalance(result.toString());
        console.log("balance of wallet contract: ", result);
      }).catch((err) => {
        console.log("error: ", err);
      })
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

              <Button style={balanceButton} onClick={checkBalance}>
                    Check Balance
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

const balanceButton = {
  backgroundColor: "#FF8500",
  fontSize: "10px",
  fontWeight: "400",
  color: "white",
  border: "none",
  outline: "none",
  height: "60px",
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
