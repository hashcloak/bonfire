import React, { useEffect, useState } from "react";
import 'bootstrap/dist/css/bootstrap.css';
import "./App.css";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import QRCode from "react-qr-code";
import Button from "react-bootstrap/Button";
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import { ethers } from "ethers";

function App(this: any) {
  const [loaded, setLoaded] = useState(false);
  const [pubkey, setPubkey] = useState<any[]>();
  const [show, setShow] = useState(false);
  const [receiver, setReceiver] = useState("");
  const [Provider, setProvider] = useState<ethers.BrowserProvider | null>(new ethers.BrowserProvider(window.ethereum));
  const [Signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [ContractAddress, setContractAddress] = useState<string>("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");

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
  }, [])

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

          if (Provider === null) {
            console.log('Provider not found, this is needed to instantiate Burner wallet...');
            return;
          }
      
          const signer = Provider.getSigner();
          signer.then((s) => {
            setSigner(s);
            console.log('signer',s);

            const abi = [
              "function fibonacci(uint256 n) external view returns (uint256)",
              "function calculateFibonacci(uint256 n) external",
            ];
            const contract = new ethers.Contract(ContractAddress, abi, s);
        
            contract.calculateFibonacci(5)
              .then((t) => {
                console.log(t);
                setPubkey(pubkeyArray);
                // TODO call contract and get burner wallet address. Set address. 
              }).catch(() => {
                console.log("transaction rejected");
              })
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
          <div className="col-6">
            <div className="card p-3" style={balance_card}>
              <div className="card-header text-start">
                <h2>Balance</h2>
              </div>

              <div className="card-body">
                {/* TODO add balances */}
              </div>
            </div>
          </div>

          <div className="col-4">
            <div className="card p-3" style={wallet_card}>
            <div className="card-header">
              <h2>Your Bonfire Address</h2>
            </div>
              <div className="card-body">
                
              <QRCode
                size={256}
                style={{ height: "auto", maxWidth: "100%", width: "100%"}}
                value={pubkey.toString()} //TODO this needs to be the address
                viewBox={`0 0 256 256`}
                /><br></br>
                <p className="pt-3">0xb794f5ea0ba39494ce839613fffba74279579268</p> {/*TODO this needs to be the address*/}
              </div>

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
