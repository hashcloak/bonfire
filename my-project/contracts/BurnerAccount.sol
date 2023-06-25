// SPDX-License-Identifier: Apache-2.0
import {IBonsaiRelay} from "bonsai-lib-sol/IBonsaiRelay.sol";
import {BonsaiCallbackReceiver} from "bonsai-lib-sol/BonsaiCallbackReceiver.sol";

pragma solidity ^0.8.17;

contract BurnerAccount is BonsaiCallbackReceiver {
    //public key
    uint256[2] private publicKey;

    //owner
    address public owner;

    /// @notice Image ID of the only zkVM binary to accept callbacks from.
    bytes32 public immutable fibImageId;

    /// @notice Gas limit set on the callback from Bonsai.
    /// @dev Should be set to the maximum amount of gas your callback might reasonably consume.
    uint64 private constant BONSAI_CALLBACK_GAS_LIMIT = 100000;

    /// @notice Initialize the contract, binding it to a specified Bonsai relay and RISC Zero guest image.
    constructor(
        IBonsaiRelay bonsaiRelay,
        bytes32 _fibImageId,
        uint256[2] memory _publicKey
    ) BonsaiCallbackReceiver(bonsaiRelay) {
        fibImageId = _fibImageId;
        publicKey = _publicKey;
        owner = msg.sender;
    }

    receive() external payable {}

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function send(
        bool verify_result,
        address payable _to,
        uint256 value
    ) external onlyBonsaiCallback(fibImageId) {
        require(verify_result, "Sig failed");
        (bool sent, bytes memory data) = _to.call{value: value}("");
        require(sent, "Failed to send Ether");
    }

    function verifyAndSend(
        address _to,
        bytes calldata auth_data,
        uint256 value
    ) external {
        bonsaiRelay.requestCallback(
            fibImageId,
            abi.encodePacked(publicKey, _to, auth_data, value),
            address(this),
            this.send.selector,
            BONSAI_CALLBACK_GAS_LIMIT
        );
    }
}
