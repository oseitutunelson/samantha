import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "amoy",
  chainType: "l1",
});
async function main() {
  console.log("📊 Parsing Chainlink response and adding matches...\n");

  const [owner] = await ethers.getSigners();
  const contractAddress = "0x8A147A05A6DEC51f89b0e3aa836725802977D83a"; // Update this with the actual deployed contract address on Amoy!

  const BettingContract = await ethers.getContractFactory("BettingContract", owner);
  const contract = BettingContract.attach(contractAddress);

  // PASTE THE RESPONSE FROM CHAINLINK FUNCTIONS UI HERE
  // Go to https://functions.chain.link/polygon-amoy, find your request, copy "Computation result"
  const response = "537898:Burnley(1.38)-Draw(3.45)-Chelsea(1.16)|537895:Bournemouth(1.96)-Draw(3.21)-WestHam(1.52)|537896:BrightonHove(2.44)-Draw(3.35)-Brentford(2.20)|537899:Fulham(2.27)-Draw(3.31)-Sunderland(2.19)|537900:Liverpool(2.91)-Draw(3.32)-Nottingham(2.54)";

  console.log("Using response:", response);

  if (!response || response.length === 0) {
    console.log("❌ No response provided. Copy it from Chainlink Functions UI!");
    return;
  }

  // Parse the response
  const matchStrings = response.split("|");
  console.log(`\nFound ${matchStrings.length} matches\n`);

  const matches: any[] = [];

  for (let i = 0; i < matchStrings.length; i++) {
    const matchStr = matchStrings[i];
    
    try {
      // Parse: "537898:Burnley(1.38)-Draw(3.45)-Chelsea(1.16)"
      const [idPart, rest] = matchStr.split(":");
      const id = BigInt(idPart);
      
      const parts = rest.split("-");
      
      // Parse home: "Burnley(1.38)"
      const homeMatch = parts[0].match(/^(.+?)\(([0-9.]+)\)$/);
      const home = homeMatch ? homeMatch[1] : "Team A";
      const hOdds = homeMatch ? Math.round(parseFloat(homeMatch[2]) * 100) : 200;
      
      // Parse draw: "Draw(3.45)"
      const drawMatch = parts[1].match(/\(([0-9.]+)\)$/);
      const dOdds = drawMatch ? Math.round(parseFloat(drawMatch[1]) * 100) : 300;
      
      // Parse away: "Chelsea(1.16)"
      const awayMatch = parts[2].match(/^(.+?)\(([0-9.]+)\)$/);
      const away = awayMatch ? awayMatch[1] : "Team B";
      const aOdds = awayMatch ? Math.round(parseFloat(awayMatch[2]) * 100) : 200;
      
      const matchDate = BigInt(Math.floor(Date.now() / 1000) + (i + 1) * 86400);
      
      matches.push({
        id,
        home,
        away,
        matchDate,
        hOdds,
        dOdds,
        aOdds
      });
      
      console.log(`${i + 1}. ${home} vs ${away}`);
      console.log(`   ID: ${id}, Odds: ${hOdds/100}x / ${dOdds/100}x / ${aOdds/100}x`);
    } catch (error) {
      console.error(`Failed to parse match ${i + 1}:`, matchStr);
    }
  }

  if (matches.length === 0) {
    console.log("❌ No matches parsed successfully");
    return;
  }

  console.log(`\n📤 Clearing old matches...`);
  let tx = await contract.clearMatches();
  await tx.wait();
  console.log("✅ Cleared");

  console.log(`\n📤 Adding ${matches.length} matches one by one...`);

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    console.log(`  Adding match ${i + 1}/${matches.length}: ${m.home} vs ${m.away}...`);
    
    tx = await contract.addMatch(
      m.id,
      m.home,
      m.away,
      m.matchDate,
      m.hOdds,
      m.dOdds,
      m.aOdds
    );
    
    await tx.wait();
    console.log(`  ✅ Added`);
  }

  console.log("\n📤 Finalizing...");
  tx = await contract.finalizeMatches();
  await tx.wait();
  console.log("✅ Done!");

  const matchCount = await contract.getMatchIdsLength();
  console.log(`\n📊 Total matches in contract: ${matchCount.toString()}`);
  console.log("\n🎉 All matches added! Check your frontend!");
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exitCode = 1;
});