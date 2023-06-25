import React from 'react';
import { ethers } from "ethers";
import { useState, createContext, useContext } from 'react'
import './App.css';

const abi = [
  "constructor(address bonsaiRelay, bytes32 _fibImageId, uint256[2] _publicKey)",
  "function send(bool verify_result, address _to, uint256 value)",
  "function verifyAndSend(address _to, bytes auth_data, uint256 value)"
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

  const CreateWallet = (pubkeyA: string, pubkeyB: string) => {
    const bytecode = "0x60c060405234801561001057600080fd5b5060405161080c38038061080c83398101604081905261002f916100d3565b6001600160a01b03831660805260a082905261004e600082600261006a565b5050600280546001600160a01b031916331790555061017c9050565b8260028101928215610098579160200282015b8281111561009857825182559160200191906001019061007d565b506100a49291506100a8565b5090565b5b808211156100a457600081556001016100a9565b634e487b7160e01b600052604160045260246000fd5b6000806000608084860312156100e857600080fd5b83516001600160a01b03811681146100ff57600080fd5b80935050602080850151925085605f86011261011a57600080fd5b604080519081016001600160401b038111828210171561013c5761013c6100bd565b60405280608087018881111561015157600080fd5b604088015b8181101561016d5780518352918401918401610156565b50505080925050509250925092565b60805160a0516106496101c360003960008181608e01528181610151015261024f01526000818161010d015281816102200152818161030a015261034701526106496000f3fe60806040526004361061004e5760003560e01c8063041507c51461005a57806313234edc1461007c5780638da5cb5b146100c3578063e70ffd4b146100fb578063f885dd8f1461012f57600080fd5b3661005557005b600080fd5b34801561006657600080fd5b5061007a6100753660046103ee565b61014f565b005b34801561008857600080fd5b506100b07f000000000000000000000000000000000000000000000000000000000000000081565b6040519081526020015b60405180910390f35b3480156100cf57600080fd5b506002546100e3906001600160a01b031681565b6040516001600160a01b0390911681526020016100ba565b34801561010757600080fd5b506100e37f000000000000000000000000000000000000000000000000000000000000000081565b34801561013b57600080fd5b5061007a61014a366004610431565b61021e565b7f00000000000000000000000000000000000000000000000000000000000000006101786102ff565b6101818161037f565b836101c05760405162461bcd60e51b815260206004820152600a60248201526914da59c819985a5b195960b21b60448201526064015b60405180910390fd5b600080846001600160a01b03168460405160006040518083038185875af1925050503d806000811461020e576040519150601f19603f3d011682016040523d82523d6000602084013e610213565b606091505b505050505050505050565b7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031663e80802a27f00000000000000000000000000000000000000000000000000000000000000006000878787876040516020016102889594939291906104ba565b60408051601f19818403018152908290526001600160e01b031960e085901b1682526102c79291309063041507c560e01b90620186a090600401610514565b600060405180830381600087803b1580156102e157600080fd5b505af11580156102f5573d6000803e3d6000fd5b5050505050505050565b336001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016811461037c5760405163432e033760e11b81526001600160a01b037f000000000000000000000000000000000000000000000000000000000000000081166004830152821660248201526044016101b7565b50565b6000803661038e6020826105a4565b6103999282906105cb565b6103a2916105f5565b90508082146103ce57604051630be5472b60e41b815260048101839052602481018290526044016101b7565b5050565b80356001600160a01b03811681146103e957600080fd5b919050565b60008060006060848603121561040357600080fd5b8335801515811461041357600080fd5b9250610421602085016103d2565b9150604084013590509250925092565b6000806000806060858703121561044757600080fd5b610450856103d2565b9350602085013567ffffffffffffffff8082111561046d57600080fd5b818701915087601f83011261048157600080fd5b81358181111561049057600080fd5b8860208285010111156104a257600080fd5b95986020929092019750949560400135945092505050565b60008187825b60028110156104df5781548352602090920191600191820191016104c0565b5050506bffffffffffffffffffffffff198660601b166040830152838560548401375060549201918201526074019392505050565b8581526000602060a08184015286518060a085015260005b818110156105485788810183015185820160c00152820161052c565b50600060c08286018101919091526001600160a01b03881660408601526001600160e01b031987166060860152601f909101601f1916840101915061058a9050565b67ffffffffffffffff831660808301529695505050505050565b818103818111156105c557634e487b7160e01b600052601160045260246000fd5b92915050565b600080858511156105db57600080fd5b838611156105e857600080fd5b5050820193919092039150565b803560208310156105c557600019602084900360031b1b169291505056fea2646970667358221220050f3c5016f6a76d5c9155050e773d0dba5b2124cc0b51c573f7efddff77cbc464736f6c63430008140033";
    const factory = new ethers.ContractFactory(abi, bytecode, Signer);
    // TODO: this image id is for fibonacci
    const imageId = "0xee32dd84d935ed8db5221232ab389d77b1e07bde85db192d31fcc673bfd0726f";
    const relayAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3";

    factory.deploy(relayAddress, imageId, [pubkeyA, pubkeyB]).then((contract) => {
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
    const to = "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f";
    const auth_data = "0x00";
    const value = 1;
    contract.verifyAndSend(to, auth_data, value)
      .then((f) => {
        console.log("successfully send transaction",f);
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
    if (Provider === null) { return }
    Provider.getBalance(ContractAddress)
      .then((result) => {
        console.log("balance of wallet contract: ", result);
      }).catch((err) => {
        console.log("error: ", err);
      })
  }

  return (
    <div className="App">
      <div style={{ padding: "2rem" }}>
          <h2>0. Run avail, deploy relay contract, launch relay server.</h2>
      </div>
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
        <button onClick={() => { CreateWallet("0x00","0x00") }}>create</button>
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
          <h2>4. Check the balance</h2>
          <button onClick={Check}>Check</button>
          <span>(check console log for result.)</span>
      </div>
    </div>
  );
}

export default App;
