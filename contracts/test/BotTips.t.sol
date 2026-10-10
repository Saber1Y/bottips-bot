// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {BotTips} from "../src/BotTips.sol";

contract MockERC20 {
    string public name = "Mock USD";
    uint8 public decimals = 6;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(allowance[from][msg.sender] >= amount, "allowance");
        require(balanceOf[from] >= amount, "balance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract BotTipsTest is Test {
    BotTips botTips;
    MockERC20 usdt;

    address creator = address(0xC0FFEE);
    address payer = address(0xB0B);
    address recipient = address(0xABCD);

    function setUp() public {
        botTips = new BotTips();
        usdt = new MockERC20();
        vm.deal(creator, 100 ether);
        vm.deal(payer, 100 ether);
        usdt.mint(payer, 1_000_000e6);
    }

    function test_CreateNativeRequest() public {
        vm.prank(creator);
        uint256 id = botTips.createRequest(recipient, address(0), 1 ether, "Coffee tip");

        assertEq(id, 1);
        assertEq(botTips.nextId(), 2);
        assertEq(botTips.requestCount(), 1);

        BotTips.Request memory r = botTips.getRequest(id);
        assertEq(r.creator, creator);
        assertEq(r.recipient, recipient);
        assertEq(r.amount, 1 ether);
        assertEq(uint8(r.status), uint8(BotTips.Status.Pending));
        assertEq(r.description, "Coffee tip");
    }

    function test_PayNativeRequest() public {
        vm.prank(creator);
        uint256 id = botTips.createRequest(recipient, address(0), 1 ether, "Pay me");

        uint256 before = recipient.balance;
        vm.prank(payer);
        botTips.pay{value: 1 ether}(id);
        assertEq(recipient.balance, before + 1 ether);

        BotTips.Request memory r = botTips.getRequest(id);
        assertEq(uint8(r.status), uint8(BotTips.Status.Paid));
        assertEq(r.payer, payer);
        assertGt(r.paidAt, 0);
    }

    function test_PayNativeWrongAmountReverts() public {
        vm.prank(creator);
        uint256 id = botTips.createRequest(recipient, address(0), 1 ether, "");
        vm.prank(payer);
        vm.expectRevert(abi.encodeWithSelector(BotTips.WrongAmount.selector, 1 ether, 0.5 ether));
        botTips.pay{value: 0.5 ether}(id);
    }

    function test_PayTwiceReverts() public {
        vm.prank(creator);
        uint256 id = botTips.createRequest(recipient, address(0), 1 ether, "");
        vm.prank(payer);
        botTips.pay{value: 1 ether}(id);
        vm.prank(payer);
        vm.expectRevert(BotTips.NotPending.selector);
        botTips.pay{value: 1 ether}(id);
    }

    function test_PayErc20Request() public {
        vm.prank(creator);
        uint256 id = botTips.createRequest(recipient, address(usdt), 250e6, "Invoice #1");

        vm.prank(payer);
        usdt.approve(address(botTips), 250e6);
        vm.prank(payer);
        botTips.pay(id);

        assertEq(usdt.balanceOf(recipient), 250e6);
        assertEq(uint8(botTips.getRequest(id).status), uint8(BotTips.Status.Paid));
    }

    function test_PayErc20WithNativeValueReverts() public {
        vm.prank(creator);
        uint256 id = botTips.createRequest(recipient, address(usdt), 250e6, "");
        vm.prank(payer);
        usdt.approve(address(botTips), 250e6);
        vm.prank(payer);
        vm.expectRevert(BotTips.NativeNotAllowed.selector);
        botTips.pay{value: 1}(id);
    }

    function test_Cancel() public {
        vm.prank(creator);
        uint256 id = botTips.createRequest(recipient, address(0), 1 ether, "");
        vm.prank(creator);
        botTips.cancel(id);
        assertEq(uint8(botTips.getRequest(id).status), uint8(BotTips.Status.Cancelled));
    }

    function test_CancelNotCreatorReverts() public {
        vm.prank(creator);
        uint256 id = botTips.createRequest(recipient, address(0), 1 ether, "");
        vm.prank(payer);
        vm.expectRevert(BotTips.NotCreator.selector);
        botTips.cancel(id);
    }

    function test_GetRequestMissingReverts() public {
        vm.expectRevert(BotTips.NotFound.selector);
        botTips.getRequest(999);
    }

    function test_Paging() public {
        for (uint256 i = 0; i < 5; i++) {
            vm.prank(creator);
            botTips.createRequest(recipient, address(0), 1 ether, "r");
        }
        BotTips.Request[] memory page = botTips.getRequests(1, 2);
        assertEq(page.length, 2);
        assertEq(page[0].id, 2);
        assertEq(page[1].id, 3);

        BotTips.Request[] memory empty = botTips.getRequests(10, 5);
        assertEq(empty.length, 0);
    }

    function test_IdsByCreator() public {
        vm.prank(creator);
        botTips.createRequest(recipient, address(0), 1 ether, "");
        vm.prank(payer);
        botTips.createRequest(recipient, address(0), 2 ether, "");

        uint256[] memory ids = botTips.idsByCreator(creator);
        assertEq(ids.length, 1);
        assertEq(ids[0], 1);
    }

    function test_ZeroAmountReverts() public {
        vm.prank(creator);
        vm.expectRevert(BotTips.ZeroAmount.selector);
        botTips.createRequest(recipient, address(0), 0, "");
    }

    function test_ZeroRecipientReverts() public {
        vm.prank(creator);
        vm.expectRevert(BotTips.ZeroRecipient.selector);
        botTips.createRequest(address(0), address(0), 1 ether, "");
    }
}