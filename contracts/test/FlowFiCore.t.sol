// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@forge-std/Test.sol";
import "../src/FlowFiCore.sol";
import "../src/RewardsManager.sol";

contract FlowFiCoreTest is Test {
    FlowFiCore public flowFiCore;
    RewardsManager public rewardsManager;
    
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    address public merchant = makeAddr("merchant");
    
    function setUp() public {
        flowFiCore = new FlowFiCore();
        rewardsManager = new RewardsManager();
        
        flowFiCore.setRewardsManager(address(rewardsManager));
        rewardsManager.setFlowFiCore(address(flowFiCore));
        
        // Fund test accounts
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
    }
    
    function testCreatePayment() public {
        vm.prank(alice);
        bytes32 paymentId = flowFiCore.createPayment(
            bob,
            1 ether,
            address(0),
            "Test payment"
        );
        
        FlowFiCore.Payment memory payment = flowFiCore.getPayment(paymentId);
        assertEq(payment.from, alice);
        assertEq(payment.to, bob);
        assertEq(payment.amount, 1 ether);
        assertEq(payment.token, address(0));
        assertFalse(payment.isCompleted);
    }
    
    function testExecutePayment() public {
        vm.prank(alice);
        bytes32 paymentId = flowFiCore.createPayment(
            bob,
            1 ether,
            address(0),
            "Test payment"
        );
        
        uint256 bobBalanceBefore = bob.balance;
        
        vm.prank(alice);
        flowFiCore.executePayment{value: 1 ether}(paymentId);
        
        FlowFiCore.Payment memory payment = flowFiCore.getPayment(paymentId);
        assertTrue(payment.isCompleted);
        
        // Check bob received payment minus platform fee
        uint256 expectedAmount = 1 ether - (1 ether * 30 / 10000); // 0.3% fee
        assertEq(bob.balance, bobBalanceBefore + expectedAmount);
    }
    
    function testMerchantRegistration() public {
        vm.prank(merchant);
        flowFiCore.registerMerchant("Coffee Shop", "Food & Beverage", 200);
        
        FlowFiCore.Merchant memory merchantInfo = flowFiCore.getMerchant(merchant);
        assertEq(merchantInfo.wallet, merchant);
        assertEq(merchantInfo.name, "Coffee Shop");
        assertEq(merchantInfo.rewardRate, 200);
        assertTrue(merchantInfo.isActive);
    }
    
    function testPaymentToMerchantEarnsRewards() public {
        // Register merchant
        vm.prank(merchant);
        flowFiCore.registerMerchant("Coffee Shop", "Food & Beverage", 200); // 2% rewards
        
        // Create payment to merchant
        vm.prank(alice);
        bytes32 paymentId = flowFiCore.createPayment(
            merchant,
            1 ether,
            address(0),
            "Coffee purchase"
        );
        
        // Execute payment
        vm.prank(alice);
        flowFiCore.executePayment{value: 1 ether}(paymentId);
        
        // Check rewards earned
        uint256 expectedRewards = (1 ether * 200) / 10000; // 2%
        assertEq(flowFiCore.userRewards(alice), expectedRewards);
    }
    
    function testCreateRecurringPayment() public {
        vm.prank(alice);
        bytes32 recurringId = flowFiCore.createRecurringPayment(
            bob,
            0.5 ether,
            address(0),
            30 days,
            "Monthly subscription"
        );
        
        FlowFiCore.RecurringPayment memory recurring = flowFiCore.getRecurringPayment(recurringId);
        assertEq(recurring.from, alice);
        assertEq(recurring.to, bob);
        assertEq(recurring.amount, 0.5 ether);
        assertTrue(recurring.isActive);
    }
}