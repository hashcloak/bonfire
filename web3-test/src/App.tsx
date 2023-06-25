import React from 'react';
import { ethers } from "ethers";
import { useState, createContext, useContext } from 'react'
import './App.css';

const abi = [
  "function fibonacci(uint256 n) external view returns (uint256)",
  "function calculateFibonacci(uint256 n) external",
];

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
    // TODO: this is ERC20 bytecode now so this must be replaced with bytecode for wallet contract.
    const bytecode = "0x608060405234801561001057600080fd5b506040516103bc3803806103bc83398101604081905261002f9161007c565b60405181815233906000907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9060200160405180910390a333600090815260208190526040902055610094565b60006020828403121561008d578081fd5b5051919050565b610319806100a36000396000f3fe608060405234801561001057600080fd5b506004361061004c5760003560e01c8063313ce5671461005157806370a082311461006557806395d89b411461009c578063a9059cbb146100c5575b600080fd5b604051601281526020015b60405180910390f35b61008e610073366004610201565b6001600160a01b031660009081526020819052604090205490565b60405190815260200161005c565b604080518082018252600781526626bcaa37b5b2b760c91b6020820152905161005c919061024b565b6100d86100d3366004610222565b6100e8565b604051901515815260200161005c565b3360009081526020819052604081205482111561014b5760405162461bcd60e51b815260206004820152601a60248201527f696e73756666696369656e7420746f6b656e2062616c616e6365000000000000604482015260640160405180910390fd5b336000908152602081905260408120805484929061016a9084906102b6565b90915550506001600160a01b0383166000908152602081905260408120805484929061019790849061029e565b90915550506040518281526001600160a01b0384169033907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9060200160405180910390a350600192915050565b80356001600160a01b03811681146101fc57600080fd5b919050565b600060208284031215610212578081fd5b61021b826101e5565b9392505050565b60008060408385031215610234578081fd5b61023d836101e5565b946020939093013593505050565b6000602080835283518082850152825b818110156102775785810183015185820160400152820161025b565b818111156102885783604083870101525b50601f01601f1916929092016040019392505050565b600082198211156102b1576102b16102cd565b500190565b6000828210156102c8576102c86102cd565b500390565b634e487b7160e01b600052601160045260246000fdfea2646970667358221220d80384ce584e101c5b92e4ee9b7871262285070dbcd2d71f99601f0f4fcecd2364736f6c63430008040033";
    const abi = [
      "constructor(uint totalSupply)"
    ];
    const factory = new ethers.ContractFactory(abi, bytecode, Signer);
    factory.deploy(ethers.parseUnits("100")).then((contract) => {
      console.log("deploy started...");
      return contract.waitForDeployment();
    }).then((result) => {
      console.log("deploy completed. Getting address...");
      return result.getAddress();
    }).then((address) => {
      console.log(address);
    });
  }

  // Calls request function for our contract;
  const Send = () => {
    if (Signer === null) {
      console.log('signer not found');
      return;
    }
    if (ContractAddress === null) {
      console.log('contract address not found');
      return;
    }

    // read & write
    const contract = new ethers.Contract(ContractAddress, abi, Signer);

    // TODO: use publickey, signature, message
    contract.calculateFibonacci(5)
      .then((f) => {
        console.log("successfully send transaction caluculateFibonacci(5)",f);
      })
  }

  const Check = () => {
    if (ContractAddress === null) {
      console.log('contract address not found');
      return;
    }
    // readonly
    const contract = new ethers.Contract(ContractAddress, abi, Provider);

    // TODO: check the result of money transfer
    contract.fibonacci(5)
      .then( (result) => {
        console.log("result of fibonacci(5): ", result);
      })
  }

  return (
    <div className="App">
      <div className="ConnectWallet" style={{ padding: "2rem" }}>
          <h2>1. connect wallet</h2>
          <button onClick={Connect}>connect</button>
          <div>{Signer === null ? 'not connected' : 'connected ' + Signer.address}</div>
      </div>
      <div className="CreateWallet" style={{ padding: "2rem" } }>
        <h2>2. Create Wallet (only first)</h2>
        <ul>
            <li>
              <span>Deposit Amount</span><input></input>
            </li>
        </ul>
        <button onClick={CreateWallet}>create</button>
          <span>(check console log for result.)</span>
      </div>
      <div className="Send" style={{ padding: "2rem"} }>
          <h2>3. Send money from contract</h2>
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
          <button onClick={Send}>Submit send request</button>
          <span>(check console log for result. wait for 1 conf on blockchain.)</span>
      </div>
      <div className="Check" style={{ padding: "2rem"} }>
          <h2>4. Check the request</h2>
          <button onClick={Check}>Check</button>
          <span>(check console log for result.)</span>
      </div>
    </div>
  );
}

export default App;
