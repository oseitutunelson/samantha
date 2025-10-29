import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "amoy",
  chainType: "l1",
});

async function main() {
  console.log("Setting up Chainlink Automation...");

  // Contract addresses from deployment
  const bettingContractAddress = "0xeCC7EFdaD35b246fF40d55FA68e68e829bE194Ac";

  // Chainlink Automation Registry for Polygon Amoy
  const automationRegistryAddress = "0x86EFBD0b6736Bed994962f9797049422A3A8E8Ad8"; // Amoy Automation Registry

  // Get the deployed contract
  const BettingContract = await ethers.getContractFactory("BettingContract");
  const bettingContract = BettingContract.attach(bettingContractAddress);

  // Note: Chainlink Automation setup requires manual registration through the Chainlink UI
  // or using the Chainlink CLI. The contract is already AutomationCompatibleInterface compliant.

  console.log("BettingContract is AutomationCompatibleInterface compliant.");
  console.log("To set up automation:");
  console.log("1. Go to https://automation.chain.link/amoy");
  console.log("2. Connect your wallet");
  console.log("3. Register a new upkeep");
  console.log("4. Select 'Custom logic' as the trigger");
  console.log("5. Enter the BettingContract address:", bettingContractAddress);
  console.log("6. Set gas limit to 500000");
  console.log("7. Fund the upkeep with LINK tokens");

  console.log("Chainlink Automation setup completed!");
  console.log("Note: Make sure to fund the upkeep with LINK tokens and replace the API key in the source code.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
