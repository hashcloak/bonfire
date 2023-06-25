import React from 'react';
import { ethers } from "ethers";
import { useState, createContext, useContext } from 'react'
import './App.css';

const abi = [
  "constructor(address bonsaiRelay, bytes32 _fibImageId)",
  "function fibonacci(uint256 n)view returns (uint256)",
  "function calculateFibonacci(uint256 n)",
];

function App() {
  const [Provider, setProvider] = useState<ethers.BrowserProvider | null>(new ethers.BrowserProvider(window.ethereum));
  const [Signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [ContractAddress, setContractAddress] = useState<string | null>(null);

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
    const bytecode = "0x60c060405234801561001057600080fd5b506040516105fd3803806105fd83398101604081905261002f91610045565b6001600160a01b0390911660805260a05261007f565b6000806040838503121561005857600080fd5b82516001600160a01b038116811461006f57600080fd5b6020939093015192949293505050565b60805160a0516105376100c660003960008181606c015281816101d5015261027d015260008181610101015281816101a601528181610305015261034201526105376000f3fe608060405234801561001057600080fd5b50600436106100625760003560e01c806313234edc1461006757806361047ff4146100a15780636b370a4c146100b457806399119819146100c95780639f2275c0146100e9578063e70ffd4b146100fc575b600080fd5b61008e7f000000000000000000000000000000000000000000000000000000000000000081565b6040519081526020015b60405180910390f35b61008e6100af3660046103cd565b61013b565b6100c76100c23660046103cd565b6101a4565b005b61008e6100d73660046103cd565b60006020819052908152604090205481565b6100c76100f73660046103e6565b61027b565b6101237f000000000000000000000000000000000000000000000000000000000000000081565b6040516001600160a01b039091168152602001610098565b60008181526020819052604081205480820361019e5760405162461bcd60e51b815260206004820152601c60248201527f76616c7565206e6f7420617661696c61626c6520696e2063616368650000000060448201526064015b60405180910390fd5b92915050565b7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031663e80802a27f00000000000000000000000000000000000000000000000000000000000000008360405160200161020791815260200190565b60408051601f19818403018152908290526001600160e01b031960e085901b1682526102469291309063027c89d760e61b90620186a090600401610408565b600060405180830381600087803b15801561026057600080fd5b505af1158015610274573d6000803e3d6000fd5b5050505050565b7f00000000000000000000000000000000000000000000000000000000000000006102a46102fa565b6102ad8161037a565b827fa457fb5f6917695b86f89831bb36063cb21e8d2f4d103023fbbdb5872b911a91836040516102df91815260200190565b60405180910390a25060009182526020829052604090912055565b336001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001681146103775760405163432e033760e11b81526001600160a01b037f00000000000000000000000000000000000000000000000000000000000000008116600483015282166024820152604401610195565b50565b60008036610389602082610498565b6103949282906104b9565b61039d916104e3565b90508082146103c957604051630be5472b60e41b81526004810183905260248101829052604401610195565b5050565b6000602082840312156103df57600080fd5b5035919050565b600080604083850312156103f957600080fd5b50508035926020909101359150565b8581526000602060a08184015286518060a085015260005b8181101561043c5788810183015185820160c001528201610420565b50600060c08286018101919091526001600160a01b03881660408601526001600160e01b031987166060860152601f909101601f1916840101915061047e9050565b67ffffffffffffffff831660808301529695505050505050565b8181038181111561019e57634e487b7160e01b600052601160045260246000fd5b600080858511156104c957600080fd5b838611156104d657600080fd5b5050820193919092039150565b8035602083101561019e57600019602084900360031b1b169291505056fea26469706673582212208db10ad45e5bd769d7abf4b8d93d3489dd8f65548ed3345d3f7a43f8ec6507a564736f6c63430008140033";
    const factory = new ethers.ContractFactory(abi, bytecode, Signer);
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
      setContractAddress(address);
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
      .then((result) => {
        console.log("result of fibonacci(5): ", result);
      }).catch((err) => {
        console.log("error: ", err);
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
        <span>contractAddress { ContractAddress ? ContractAddress : 'not found' }</span>
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
