import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "amoy",
  chainType: "l1",
});

async function main() {
  console.log("🔍 Diagnosing contract issues...\n");

  const [owner] = await ethers.getSigners();
  const contractAddress = "0x01cddCc2c642EDc91800A9a893a8d2679cb98972";

  const BettingContract = await ethers.getContractFactory("BettingContract", owner);
  const contract = BettingContract.attach(contractAddress);

  console.log("📋 Checking contract configuration:\n");

  try {
    const sourceCode = await contract.matchesSourceCode();
    console.log(`✅ matchesSourceCode length: ${sourceCode.length} chars`);
    if (sourceCode.length === 0) {
      console.log("   ❌ SOURCE CODE NOT SET! Run setup script first.");
    }
  } catch (e: any) {
    console.log(`❌ Could not read matchesSourceCode: ${e.message}`);
  }

  try {
    const subscriptionId = await contract.subscriptionId();
    console.log(`✅ Subscription ID: ${subscriptionId.toString()}`);
    if (subscriptionId === 0n) {
      console.log("   ❌ SUBSCRIPTION ID IS 0! Contract not initialized properly.");
    }
  } catch (e: any) {
    console.log(`❌ Could not read subscriptionId: ${e.message}`);
  }

  try {
    const donId = await contract.donId();
    console.log(`✅ DON ID: ${donId}`);
  } catch (e: any) {
    console.log(`❌ Could not read donId: ${e.message}`);
  }

  try {
    const secretsLocation = await contract.secretsLocation();
    console.log(`✅ Secrets location: ${secretsLocation}`);
  } catch (e: any) {
    console.log(`❌ Could not read secretsLocation: ${e.message}`);
  }

  try {
    const lastRequestTime = await contract.lastMatchRequestTime();
    console.log(`✅ Last request time: ${lastRequestTime.toString()}`);
  } catch (e: any) {
    console.log(`❌ Could not read lastMatchRequestTime: ${e.message}`);
  }

  try {
    const matchCount = await contract.getMatchIdsLength();
    console.log(`✅ Current matches: ${matchCount.toString()}`);

    // Fetch and display match details
    if (matchCount > 0) {
      console.log("\n📅 Match details:");
      for (let i = 0; i < Number(matchCount); i++) {
        try {
          const matchId = await contract.matchIds(i);
          const match = await contract.matches(matchId);
          const matchDate = new Date(Number(match.matchDate) * 1000);
          console.log(`  ${i + 1}. ${match.homeTeam} vs ${match.awayTeam}`);
          console.log(`     ID: ${matchId.toString()}, Date: ${matchDate.toISOString()}, Result: ${match.result}`);
        } catch (e: any) {
          console.log(`     ❌ Error reading match ${i}: ${e.message}`);
        }
      }
    }
  } catch (e: any) {
    console.log(`❌ Could not read match count: ${e.message}`);
  }

  try {
    const contractOwner = await contract.owner();
    console.log(`✅ Contract owner: ${contractOwner}`);
    console.log(`   Your address: ${owner.address}`);
    console.log(`   Are you owner? ${contractOwner.toLowerCase() === owner.address.toLowerCase()}`);
  } catch (e: any) {
    console.log(`❌ Could not read owner: ${e.message}`);
  }

  console.log("\n🔧 Suggested fixes:");
  console.log("1. If source code not set: Run the setup script");
  console.log("2. If subscription ID is 0: Contract constructor params were wrong");
  console.log("3. If you're not owner: Use the correct wallet");
  
  console.log("\n💡 Error 0x71e83137 usually means:");
  console.log("   - EmptySource: The source code string is empty");
  console.log("   - Invalid subscription");
  console.log("   - DON ID mismatch");
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exitCode = 1;
});