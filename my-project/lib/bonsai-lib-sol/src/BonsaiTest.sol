// Copyright 2023 RISC Zero, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// SPDX-License-Identifier: Apache-2.0

pragma solidity ^0.8.17;

import "forge-std/Test.sol";
import {Strings2} from "../lib/murky/differential_testing/test/utils/Strings2.sol";
import {IBonsaiRelay} from "./IBonsaiRelay.sol";
import {BonsaiTestRelay} from "./BonsaiTestRelay.sol";

/// @notice A base contract for testing a Bonsai callback receiver contract
abstract contract BonsaiTest is Test {

    using Strings2 for bytes;

    BonsaiTestRelay internal MOCK_BONSAI_RELAY;

    /// @notice Instantiates a mock relay contract for testing
    modifier withRelayMock() {
        MOCK_BONSAI_RELAY = new BonsaiTestRelay();
        vm.recordLogs();
        _;
    }

    /// @notice Returns the journal resulting from running the guest with @imageId using @input.
    function queryImageOutput(bytes32 imageId, bytes memory input) internal returns (bytes memory) {
        string[] memory imageRunnerInput = new string[](5);
        uint i = 0;
        imageRunnerInput[i++] = 'cargo';
        imageRunnerInput[i++] = 'run';
        imageRunnerInput[i++] = '-q';
        imageRunnerInput[i++] = abi.encodePacked(imageId).toHexString();
        imageRunnerInput[i++] = input.toHexString();
        return vm.ffi(imageRunnerInput);
    }

    /// @notice Returns the image id of the guest with the specified name.
    function queryImageId(string memory binaryName) internal returns (bytes32) {
        string[] memory imageRunnerInput = new string[](4);
        uint i = 0;
        imageRunnerInput[i++] = 'cargo';
        imageRunnerInput[i++] = 'run';
        imageRunnerInput[i++] = '-q';
        imageRunnerInput[i++] = binaryName;
        return bytes32(vm.ffi(imageRunnerInput));
    }

    /// @notice Process a single callback request and invoke its receiver contract with the results.
    /// @return A boolean, true is the callback was successful and false otherwise, and the return
    ///         data from the callback. Note that the Bonsai relay will not process return data.
    function relayCallback() internal returns (bool, bytes memory) {
        vm.pauseGasMetering();
        // read logs, parse event, get image output, invoke proper callback
        bytes memory logEntry = MOCK_BONSAI_RELAY.dequeue_cbr_event_data();

        (
            bytes32 image_id,
            bytes memory input,
            address callback_contract,
            bytes4 function_selector,
            uint64 gas_limit
        ) = abi.decode(logEntry, (bytes32, bytes, address, bytes4, uint64));

        bytes memory journal = queryImageOutput(image_id, input);
        bytes memory payload = abi.encodePacked(
            function_selector,
            journal,
            image_id
        );
        vm.resumeGasMetering();

        return MOCK_BONSAI_RELAY.invoke_callback(callback_contract, payload, gas_limit);
    }
}
