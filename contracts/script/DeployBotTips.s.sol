// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {BotTips} from "../src/BotTips.sol";

/// @notice Deploys BotTips and prints the address in a greppable line.
/// Usage:
///   forge script script/DeployBotTips.s.sol:DeployBotTips --rpc-url bot_testnet --broadcast --private-key $PRIVATE_KEY
contract DeployBotTips is Script {
    function run() external returns (BotTips botTips) {
        vm.startBroadcast();
        botTips = new BotTips();
        vm.stopBroadcast();

        console.log("BotTips deployed at:", address(botTips));
    }
}