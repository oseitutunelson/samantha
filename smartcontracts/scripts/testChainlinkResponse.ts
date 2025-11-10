import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "amoy",
  chainType: "l1",
});

async function main() {
  console.log("🧪 Testing Chainlink Functions response format...\n");

  const [owner] = await ethers.getSigners();
  const bettingContractAddress = "0x7EecC8E10B83222816499835820B7727fd6F046e";

  const BettingContract = await ethers.getContractFactory("BettingContract", owner);
  const bettingContract = BettingContract.attach(bettingContractAddress).connect(owner);

  console.log("📡 Sending request to Chainlink Functions...");
  console.log("⚠️  Make sure you have LINK in your subscription!\n");

  try {
    // Request matches
    const tx = await bettingContract.requestMatches();
    console.log(`✅ Transaction sent: ${tx.hash}`);
    console.log("⏳ Waiting for confirmation...");
    
    const receipt = await tx.wait();
    
    if (!receipt) {
      throw new Error("Transaction receipt is null");
    }
    
    console.log("✅ Transaction confirmed!");
    
    // Find the request ID from events
    const requestSentEvent = receipt.logs.find((log: any) => {
      try {
        const parsed = bettingContract.interface.parseLog(log);
        return parsed?.name === "RequestSent";
      } catch {
        return false;
      }
    });

    if (requestSentEvent) {
      const parsed = bettingContract.interface.parseLog(requestSentEvent);
      console.log(`\n🔑 Request ID: ${parsed?.args?.id}`);
    }

    console.log("\n⏱️  Now waiting 60 seconds for Chainlink to process...");
    console.log("📊 You can check progress at:");
    console.log("   https://functions.chain.link/polygon-amoy\n");

    // Wait 60 seconds
    for (let i = 60; i > 0; i--) {
      process.stdout.write(`\r⏳ ${i} seconds remaining...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log("\n\n✅ Checking if matches were added...");
    
    const matchCount = await bettingContract.getMatchIdsLength();
    console.log(`📊 Matches in contract: ${matchCount.toString()}`);
    
    if (matchCount > 0) {
      console.log("\n🎉 SUCCESS! Matches were added:");
      for (let i = 0; i < Number(matchCount); i++) {
        const id = await bettingContract.matchIds(i);
        const match = await bettingContract.matches(id);
        console.log(`  ${i + 1}. ${match.homeTeam} vs ${match.awayTeam}`);
      }
    } else {
      console.log("\n❌ No matches added yet.");
      console.log("\n💡 Possible issues:");
      console.log("   1. Chainlink request still processing (wait longer)");
      console.log("   2. No matches scheduled in next 7 days");
      console.log("   3. API key invalid");
      console.log("   4. Response parsing failed in contract");
      console.log("\nCheck Chainlink Functions UI for detailed error messages.");
    }

  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    
    if (error.message.includes("Too soon")) {
      console.log("\n💡 Request interval not passed. Try:");
      console.log("   const tx = await bettingContract.resetLastRequestTime();");
      console.log("   await tx.wait();");
    }
  }
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exitCode = 1;
});