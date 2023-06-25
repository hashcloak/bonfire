import React, { useEffect, useState } from "react";
import 'bootstrap/dist/css/bootstrap.css';
import "./App.css";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import QRCode from "react-qr-code";
import Button from "react-bootstrap/Button";
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import { ethers } from "ethers";

const abi = [
  "constructor(address bonsaiRelay, bytes32 _fibImageId)",
  "function fibonacci(uint256 n)view returns (uint256)",
  "function calculateFibonacci(uint256 n)",
];


function App(this: any) {
  const [loaded, setLoaded] = useState(false);
  const [pubkey, setPubkey] = useState<any[]>();
  const [show, setShow] = useState(false);
  const [receiver, setReceiver] = useState("");
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(new ethers.BrowserProvider(window.ethereum));
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [contractAddress, setContractAddress] = useState<string | null>("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");
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
          let pubkeyArray: any[] = [];
          for (let i = 10; i < 42; i++) {
            pubkeyArray.push(verificationJSON.pubkey[i]);
          }
          for (let i = 45; i < 77; i++) {
            pubkeyArray.push(verificationJSON.pubkey[i]);
          }
          console.log(pubkeyArray);

          if (provider === null) {
            console.log('Provider not found, this is needed to instantiate Burner wallet...');
            return;
          }
      
          const signer = provider.getSigner();
          signer.then((s) => {
            setSigner(s);

            // TODO: this is ERC20 bytecode now so this must be replaced with bytecode for wallet contract.
            const bytecode = "0x60c060405234801561001057600080fd5b506040516105fd3803806105fd83398101604081905261002f91610045565b6001600160a01b0390911660805260a05261007f565b6000806040838503121561005857600080fd5b82516001600160a01b038116811461006f57600080fd5b6020939093015192949293505050565b60805160a0516105376100c660003960008181606c015281816101d5015261027d015260008181610101015281816101a601528181610305015261034201526105376000f3fe608060405234801561001057600080fd5b50600436106100625760003560e01c806313234edc1461006757806361047ff4146100a15780636b370a4c146100b457806399119819146100c95780639f2275c0146100e9578063e70ffd4b146100fc575b600080fd5b61008e7f000000000000000000000000000000000000000000000000000000000000000081565b6040519081526020015b60405180910390f35b61008e6100af3660046103cd565b61013b565b6100c76100c23660046103cd565b6101a4565b005b61008e6100d73660046103cd565b60006020819052908152604090205481565b6100c76100f73660046103e6565b61027b565b6101237f000000000000000000000000000000000000000000000000000000000000000081565b6040516001600160a01b039091168152602001610098565b60008181526020819052604081205480820361019e5760405162461bcd60e51b815260206004820152601c60248201527f76616c7565206e6f7420617661696c61626c6520696e2063616368650000000060448201526064015b60405180910390fd5b92915050565b7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031663e80802a27f00000000000000000000000000000000000000000000000000000000000000008360405160200161020791815260200190565b60408051601f19818403018152908290526001600160e01b031960e085901b1682526102469291309063027c89d760e61b90620186a090600401610408565b600060405180830381600087803b15801561026057600080fd5b505af1158015610274573d6000803e3d6000fd5b5050505050565b7f00000000000000000000000000000000000000000000000000000000000000006102a46102fa565b6102ad8161037a565b827fa457fb5f6917695b86f89831bb36063cb21e8d2f4d103023fbbdb5872b911a91836040516102df91815260200190565b60405180910390a25060009182526020829052604090912055565b336001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001681146103775760405163432e033760e11b81526001600160a01b037f00000000000000000000000000000000000000000000000000000000000000008116600483015282166024820152604401610195565b50565b60008036610389602082610498565b6103949282906104b9565b61039d916104e3565b90508082146103c957604051630be5472b60e41b81526004810183905260248101829052604401610195565b5050565b6000602082840312156103df57600080fd5b5035919050565b600080604083850312156103f957600080fd5b50508035926020909101359150565b8581526000602060a08184015286518060a085015260005b8181101561043c5788810183015185820160c001528201610420565b50600060c08286018101919091526001600160a01b03881660408601526001600160e01b031987166060860152601f909101601f1916840101915061047e9050565b67ffffffffffffffff831660808301529695505050505050565b8181038181111561019e57634e487b7160e01b600052601160045260246000fd5b600080858511156104c957600080fd5b838611156104d657600080fd5b5050820193919092039150565b8035602083101561019e57600019602084900360031b1b169291505056fea26469706673582212208db10ad45e5bd769d7abf4b8d93d3489dd8f65548ed3345d3f7a43f8ec6507a564736f6c63430008140033";
            const factory = new ethers.ContractFactory(abi, bytecode, s);
            // TODO: this image id is for fibonacci
            const imageId = "0xee32dd84d935ed8db5221232ab389d77b1e07bde85db192d31fcc673bfd0726f";
            const relayAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3";

            factory.deploy(relayAddress, imageId).then((contract) => {
              console.log("deploy started...");
              return contract.waitForDeployment();
            }).then((result) => {
              console.log("deploy completed. Getting address...");
              return result.getAddress();
            }).then((address) => {
              console.log(address);
              setPubkey(pubkeyArray);
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

    const verificationJSON = await verificationResp.json();
    console.log(verificationJSON);
    if (verificationJSON && verificationJSON.verified) {
      console.log("Authentication successful");
    } else {
      console.error("Authentication failed");
    }

    setReceiver("");

    // TODO Send signature to contract for funds
  }


  if (pubkey)   return (
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
