// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@forge-std/Script.sol";
import "../src/FlowFiCore.sol";
import "../src/RewardsManager.sol";
import "../src/SplitPayments.sol";
import "../src/YieldVault.sol";

/**
 * @title FlowFi Deployment Script
 * @notice Deploys all FlowFi contracts to Morph testnet
 */
contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy core contracts
        console.log("Deploying FlowFi contracts...");

        // 1. Deploy FlowFi Core
        FlowFiCore flowFiCore = new FlowFiCore();
        console.log("FlowFi Core deployed at:", address(flowFiCore));

        // 2. Deploy Rewards Manager
        RewardsManager rewardsManager = new RewardsManager();
        console.log("Rewards Manager deployed at:", address(rewardsManager));

        // 3. Deploy Split Payments
        SplitPayments splitPayments = new SplitPayments();
        console.log("Split Payments deployed at:", address(splitPayments));

        // 4. Deploy Yield Vault
        YieldVault yieldVault = new YieldVault();
        console.log("Yield Vault deployed at:", address(yieldVault));

        // Configure contract interactions
        console.log("Configuring contract interactions...");

        // Set up FlowFi Core
        flowFiCore.setRewardsManager(address(rewardsManager));
        flowFiCore.setSplitPaymentsContract(address(splitPayments));

        // Set up Rewards Manager
        rewardsManager.setFlowFiCore(address(flowFiCore));
        rewardsManager.setYieldVault(address(yieldVault));

        // Set up Yield Vault
        yieldVault.setRewardsManager(address(rewardsManager));
        yieldVault.setFlowFiCore(address(flowFiCore));

        // Add USDT as supported token (common testnet USDT address)
        // Note: Replace with actual Morph testnet USDT address
        address usdtAddress = 0x7169D38820dfd117C3FA1f22a697dBA58d90BA06; // Example address
        try yieldVault.addSupportedToken(usdtAddress, 800) { // 8% APY for USDT
            console.log("USDT support added to Yield Vault");
        } catch {
            console.log("Could not add USDT support - address may be invalid");
        }

        vm.stopBroadcast();

        // Log deployment summary
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("FlowFi Core:", address(flowFiCore));
        console.log("Rewards Manager:", address(rewardsManager));
        console.log("Split Payments:", address(splitPayments));
        console.log("Yield Vault:", address(yieldVault));
        console.log("Network: Morph Testnet (Chain ID: 2710)");
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        console.log("==========================");

        // Save deployment info to file
        string memory deploymentInfo = string(
            abi.encodePacked(
                "FLOWFI_CORE_ADDRESS=", vm.toString(address(flowFiCore)), "\n",
                "REWARDS_MANAGER_ADDRESS=", vm.toString(address(rewardsManager)), "\n", 
                "SPLIT_PAYMENTS_ADDRESS=", vm.toString(address(splitPayments)), "\n",
                "YIELD_VAULT_ADDRESS=", vm.toString(address(yieldVault)), "\n"
            )
        );

        vm.writeFile("deployment.env", deploymentInfo);
        console.log("Deployment addresses saved to deployment.env");
    }
}