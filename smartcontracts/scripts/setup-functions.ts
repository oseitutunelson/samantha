import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "amoy",
  chainType: "l1",
});

async function main() {
  console.log("🔧 Setting up Chainlink Functions (Upcoming Matches)...");

  const [owner] = await ethers.getSigners();
  const bettingContractAddress = "0x513EC06a093b9c027e07Ed00427A5269d1E0F4B9";

  const BettingContract = await ethers.getContractFactory("BettingContract", owner);
  const bettingContract = BettingContract.attach(bettingContractAddress).connect(owner);

  const API_KEY = process.env.VITE_FOOTBALL_API_KEY;
  if (!API_KEY) {
    throw new Error("❌ FOOTBALL_API_KEY not found in environment variables");
  }

  console.log("📝 Creating source code for UPCOMING matches (next 14 days)...");

  // Fetch upcoming matches in the next 7 days instead of just today
  const matchesSourceCode = `
    const API_KEY = "${API_KEY}";
    const today = new Date();
    const dateFrom = today.toISOString().split("T")[0];
    
    const future = new Date();
    future.setDate(future.getDate() + 14);
    const dateTo = future.toISOString().split("T")[0];
    
    const url = \`https://api.football-data.org/v4/competitions/PL/matches?dateFrom=\${dateFrom}&dateTo=\${dateTo}&status=SCHEDULED\`;
    const headers = { "X-Auth-Token": API_KEY };
    
    const response = await Functions.makeHttpRequest({ url, headers });
    if (!response || !response.data) {
      throw new Error("API request failed");
    }
    
    const matches = response.data.matches || [];
    if (matches.length === 0) {
      return Functions.encodeString("NO_MATCHES");
    }
    
    const results = [];
    for (let i = 0; i < Math.min(5, matches.length); i++) {
      const match = matches[i];
      const home = (match.homeTeam.shortName || match.homeTeam.name || "Home").replace(/[^a-zA-Z0-9]/g, '');
      const away = (match.awayTeam.shortName || match.awayTeam.name || "Away").replace(/[^a-zA-Z0-9]/g, '');
      const matchId = String(match.id);
      const homeOdds = (Math.random() * 2 + 1).toFixed(2);
      const drawOdds = (Math.random() * 2 + 2).toFixed(2);
      const awayOdds = (Math.random() * 2 + 1).toFixed(2);
      
      const matchStr = matchId + ":" + home + "(" + homeOdds + ")-Draw(" + drawOdds + ")-" + away + "(" + awayOdds + ")";
      results.push(matchStr);
    }
    
    const finalString = results.join("|");
    if (finalString.length > 250) {
      return Functions.encodeString(finalString.substring(0, 250));
    }
    return Functions.encodeString(finalString);
  `;

  const resultsSourceCode = `
    const API_KEY = "${API_KEY}";
    const matchId = args[0];
    const url = \`https://api.football-data.org/v4/matches/\${matchId}\`;
    const headers = { "X-Auth-Token": API_KEY };
    
    const response = await Functions.makeHttpRequest({ url, headers });
    if (!response || !response.data) {
      throw new Error("API request failed");
    }
    
    const match = response.data;
    let result = 0;
    
    if (match.status === "FINISHED") {
      const homeScore = match.score.fullTime.home;
      const awayScore = match.score.fullTime.away;
      
      if (homeScore > awayScore) {
        result = 1;
      } else if (homeScore < awayScore) {
        result = 3;
      } else {
        result = 2;
      }
    }
    
    return Functions.encodeUint256(result);
  `;

  console.log("📤 Configuring contract...");
  
  const tx1 = await bettingContract.setMatchesSource(matchesSourceCode);
  await tx1.wait();
  console.log("✅ Matches source code set (next 14 days)");

  const tx2 = await bettingContract.setResultsSource(resultsSourceCode);
  await tx2.wait();
  console.log("✅ Results source code set");

  const tx3 = await bettingContract.setSecretsReference(255, "0x");
  await tx3.wait();
  console.log("✅ Secrets disabled (using embedded API key)");

  const tx4 = await bettingContract.setRequestInterval(0);
  await tx4.wait();
  console.log("✅ Request interval set to 0");

  console.log("\n🎯 Setup Complete!");
  console.log("✨ Will fetch upcoming matches in next 14 days!");
  console.log("\n📋 Configuration:");
  console.log("   • Date Range: Today + 14 days");
  console.log("   • Max Matches: 5");
  console.log("   • API Key: Embedded in source code");
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exitCode = 1;
});