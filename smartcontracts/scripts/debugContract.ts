import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "amoy",
  chainType: "l1",
});

async function main() {
  console.log("🔍 Debugging BettingContract state...\n");

  const [owner] = await ethers.getSigners();
  const bettingContractAddress = "0x01cddCc2c642EDc91800A9a893a8d2679cb98972";

  const BettingContract = await ethers.getContractFactory("BettingContract", owner);
  const bettingContract = BettingContract.attach(bettingContractAddress).connect(owner);

  // 1. Check match count
  const matchCount = await bettingContract.getMatchIdsLength();
  console.log(`📊 Total matches in contract: ${matchCount.toString()}`);

  if (matchCount > 0) {
    console.log("\n✅ Matches found! Reading them:\n");
    
    for (let i = 0; i < Number(matchCount); i++) {
      const id = await bettingContract.matchIds(i);
      const match = await bettingContract.matches(id);
      
      console.log(`Match ${i + 1}:`);
      console.log(`  ID: ${match.id.toString()}`);
      console.log(`  Home: ${match.homeTeam}`);
      console.log(`  Away: ${match.awayTeam}`);
      console.log(`  Date: ${new Date(Number(match.matchDate) * 1000).toLocaleString()}`);
      console.log(`  Result: ${match.result}`);
      console.log(`  Odds: ${Number(match.homeOdds)/100}x / ${Number(match.drawOdds)/100}x / ${Number(match.awayOdds)/100}x`);
      console.log("");
    }
  } else {
    console.log("\n❌ No matches found in contract!");
    console.log("\n🔍 Checking configuration:\n");
    
    // Check source code
    const matchesSource = await bettingContract.matchesSourceCode();
    console.log(`Matches source set: ${matchesSource.length > 0 ? '✅ Yes' : '❌ No'}`);
    
    const resultsSource = await bettingContract.resultsSourceCode();
    console.log(`Results source set: ${resultsSource.length > 0 ? '✅ Yes' : '❌ No'}`);
    
    // Check secrets
    const secretsLocation = await bettingContract.secretsLocation();
    const secretsRef = await bettingContract.encryptedSecretsReference();
    console.log(`Secrets location: ${secretsLocation}`);
    console.log(`Secrets reference: ${secretsRef}`);
    
    // Check last request time
    const lastRequest = await bettingContract.lastMatchRequestTime();
    console.log(`Last request time: ${lastRequest > 0 ? new Date(Number(lastRequest) * 1000).toLocaleString() : 'Never'}`);
    
    console.log("\n💡 Next steps:");
    console.log("1. Call contract.requestMatches() (owner only)");
    console.log("2. Wait ~60 seconds for Chainlink to process");
    console.log("3. Check Chainlink Functions UI for errors");
    console.log("4. Run this script again to verify matches were added");
  }

  // Check subscription
  try {
    const subId = await bettingContract.subscriptionId();
    console.log(`\n💰 Subscription ID: ${subId.toString()}`);
    console.log("   Check balance at: https://functions.chain.link/polygon-amoy");
  } catch (e) {
    console.log("\n⚠️  Could not check subscription");
  }
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exitCode = 1;
});