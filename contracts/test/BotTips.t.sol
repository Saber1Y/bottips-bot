// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {BotTips} from "../src/BotTips.sol";

contract BotTipsTest is Test {
    BotTips botTips;
    address creator = address(0xC0FFEE);
    address tipper = address(0xB0B);

    function setUp() public {
        botTips = new BotTips();
        vm.deal(creator, 100 ether);
        vm.deal(tipper, 100 ether);
    }

    function test_Register() public {
        vm.prank(creator);
        botTips.register("saber", "Saber", "builder");
        assertEq(botTips.usernameToAddress("saber"), creator);
        BotTips.Creator memory c = botTips.getCreator(creator);
        assertTrue(c.exists);
        assertEq(c.username, "saber");
    }

    function test_Tip() public {
        vm.prank(creator);
        botTips.register("saber", "Saber", "builder");
        uint256 before = creator.balance;
        vm.prank(tipper);
        botTips.tip{value: 1 ether}(creator, "thanks");
        assertEq(creator.balance, before + 1 ether);
    }
}
