import React from 'react';
import { ethers } from "ethers";
import { useState, createContext, useContext } from 'react'
import './App.css';

function App() {
  const [Provider, setProvider] = useState<ethers.BrowserProvider | null>(new ethers.BrowserProvider(window.ethereum));
  const [Signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [ContractAddress, setContractAddress] = useState<string | null>("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");

  const Connect = () => {
    if (Provider === null) {
      console.log('provider not found');
      return;
    }

    const signer = Provider.getSigner();
    signer.then((s) => {
      setSigner(s);
      console.log('signer',s);
    });
  }

  const CreateWallet = () => {
  }

  const Send = () => {
    if (Signer === null) {
      console.log('signer not found');
      return;
    }
    if (ContractAddress === null) {
      console.log('contract address not found');
      return;
    }

    const abi = [
      "function fibonacci(uint256 n) external view returns (uint256)",
      "function calculateFibonacci(uint256 n) external",
    ];
    const contract = new ethers.Contract(ContractAddress, abi, Signer);

    const a = contract.calculateFibonacci(5);
    console.log(a);

  }

  return (
    <div className="App">
      <div className="ConnectWallet" style={{ padding: "2rem" }}>
          <h2>1. connect wallet</h2>
          <button onClick={Connect}>connect</button>
          <div>{Signer === null ? 'not connected' : 'connected ' + Signer.address}</div>
      </div>
      <div className="CreateWallet" style={{ padding: "2rem" } }>
        <h2>A. Create Wallet (only first)</h2>
        <ul>
            <li>
              <span>Deposit Amount</span><input></input>
            </li>
        </ul>
        <button onClick={CreateWallet}>create</button>
      </div>
      <div className="Send" style={{ padding: "2rem"} }>
          <h2>B. Send money from contract</h2>
          <ul>
              <li>
                  <span>Pubkey</span>
                  <input></input>
              </li>
              <li>
                  <span>Signature</span>
                  <input></input>
              </li>
              <li>
                  <span>Message</span>
                  <input></input>
              </li>
              <li>
                  <span>To</span>
                  <input></input>
              </li>
              <li>
                  <span>Amount</span>
                  <input></input>
              </li>
          </ul>
          <button onClick={Send}>call</button>
      </div>
    </div>
  );
}

export default App;
