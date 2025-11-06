import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "amoy",
  chainType: "l1",
});
async function main() {
  console.log("⚙️ Setting up Chainlink Automation...");

  // Your deployed BettingContract address
  const bettingContractAddress = "0x8C4D6720eD0E1ac37fAD1eD43083Fb2451358E1e";

  // Chainlink Automation Registry address for Polygon Amoy
  const automationRegistryAddress = "0x86EFBD0b6736Bed994962f9797049422A3A8E8Ad8"; // official Amoy registry

  // ----------------------------------------------------------------
  // 1️⃣ Connect signer (make sure this is the same wallet that deployed the contract)
  // ----------------------------------------------------------------
  const [owner] = await ethers.getSigners();
  console.log(`👤 Using signer: ${owner.address}`);

  // ----------------------------------------------------------------
  // 2️⃣ Attach to your deployed BettingContract
  // ----------------------------------------------------------------
  const BettingContract = await ethers.getContractFactory("BettingContract", owner);
  const bettingContract = BettingContract.attach(bettingContractAddress).connect(owner);

  // Verify contract ownership
  const contractOwner = await bettingContract.owner();
  if (contractOwner.toLowerCase() !== owner.address.toLowerCase()) {
    console.warn("⚠️ Warning: You are not the contract owner!");
    console.warn(`   Contract owner is: ${contractOwner}`);
    console.warn(`   Your address is: ${owner.address}`);
  } else {
    console.log("✅ You are the contract owner.");
  }

  // ----------------------------------------------------------------
  // 3️⃣ Automation setup guidance
  // ----------------------------------------------------------------
  console.log("\n🔗 Chainlink Automation Setup Instructions:");
  console.log("-------------------------------------------");
  console.log("1️⃣ Go to: https://automation.chain.link/amoy");
  console.log("2️⃣ Connect your wallet");
  console.log("3️⃣ Register a new upkeep");
  console.log("4️⃣ Choose 'Custom logic' as the trigger type");
  console.log(`5️⃣ Enter the BettingContract address: ${bettingContractAddress}`);
  console.log("6️⃣ Set the gas limit to around 500,000");
  console.log("7️⃣ Fund the upkeep with LINK tokens (minimum ~2 LINK)");
  console.log("8️⃣ Once registered, you can monitor upkeep status in the dashboard.");

  console.log("\n📘 Note:");
  console.log("- The contract already implements AutomationCompatibleInterface.");
  console.log("- Chainlink Automation will automatically call performUpkeep() when needed.");
  console.log("- Ensure your Chainlink subscription has enough LINK to pay for Function calls.");

  console.log("\n✅ Chainlink Automation setup script executed successfully!");
}

main().catch((error) => {
  console.error("❌ Error setting up automation:", error);
  process.exitCode = 1;
});
