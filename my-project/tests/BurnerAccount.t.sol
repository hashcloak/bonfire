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

import {BonsaiTest} from "bonsai-lib-sol/BonsaiTest.sol";
import {IBonsaiRelay} from "bonsai-lib-sol/IBonsaiRelay.sol";
import {BurnerAccount} from "contracts/BurnerAccount.sol";

contract BonsaiStarterTest is BonsaiTest {
    function setUp() public withRelayMock {}

    function testMockCall() public {
        // Deploy a new starter instance
        BurnerAccount account = new BurnerAccount(
            IBonsaiRelay(MOCK_BONSAI_RELAY),
            queryImageId("FIBONACCI"),
            [uint256(0x60FED4BA255A9D31C961EB74C6356D68C049B8923B61FA6CE669622E60F29FB6), uint256(0x7903FE1008B8BC99A41AE9E95628BC64F2F1B20C2D7E9F5177A3C294D4462299)]
        );

        // Anticipate a callback request to the relay
        vm.expectCall(
            address(MOCK_BONSAI_RELAY),
            abi.encodeWithSelector(IBonsaiRelay.requestCallback.selector)
        );
        // Request the callback
        bytes memory auth_data = abi.encodePacked(
            uint256(0xaf2bdbe1aa9b6ec1e2ade1d694f41fc71a831d0268e9891562113d8a62add1bf),
            uint256(0xEFD48B2AACB6A8FD1140DD9CD45E81D69D2C877B56AAF991C34D0EA84EAF3716),
            uint256(0xF7CB1C942D657C41D436C7A1B6E29F65F3E900DBB9AFF4064DC4AB2F843ACDA8)
        );
        account.verifyAndSend(address(account), auth_data, 100);

        // Anticipate a callback invocation on the starter contract
        vm.expectCall(
            address(account),
            abi.encodeWithSelector(BurnerAccount.send.selector)
        );
        // Relay the solution as a callback
        (bool success, ) = relayCallback();
        require(success, "Callback failed");

        // // Validate the Fibonacci solution value
        // uint256 result = starter.fibonacci(128);
        // assertEq(result, uint256(407305795904080553832073954));
    }
}
