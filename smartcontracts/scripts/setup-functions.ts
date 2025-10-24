import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "amoy",
  chainType: "l1",
});

async function main() {
  console.log("Setting up Chainlink Functions...");

  // Contract addresses from deployment
  const bettingContractAddress = "0x50cdF50Ca343d7D74c4094930F08299A5C8F930d";

  // Get the deployed contract
  const BettingContract = await ethers.getContractFactory("BettingContract");
  const bettingContract = BettingContract.attach(bettingContractAddress);

  // JavaScript source code for fetching matches
  const matchesSourceCode = `
    const apiKey = "d752945a57514a439d2fa74e8b2db2ae";  
    const url = "https://api.football-data.org/v4/matches?status=SCHEDULED&limit=10";

    const response = await Functions.makeHttpRequest({
      url: url,
      headers: {
        "X-Auth-Token": apiKey
      }
    });

    if (response.error) {
      throw Error("Request failed");
    }

    const data = response.data;
    const matches = data.matches.map(match => ({
      id: match.id,
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      matchDate: Math.floor(new Date(match.utcDate).getTime() / 1000),
      homeOdds: 200, // Default odds
      drawOdds: 300,
      awayOdds: 200
    }));

    return Functions.encodeString(JSON.stringify(matches));
  `;

  // JavaScript source code for fetching match results
  const resultsSourceCode = `
    const apiKey = "d752945a57514a439d2fa74e8b2db2ae";  
    const matchId = args[0];
    const url = \`https://api.football-data.org/v4/matches/\${matchId}\`;

    const response = await Functions.makeHttpRequest({
      url: url,
      headers: {
        "X-Auth-Token": apiKey
      }
    });

    if (response.error) {
      throw Error("Request failed");
    }

    const match = response.data;
    let result = 0; // Not played

    if (match.status === "FINISHED") {
      if (match.score.fullTime.home > match.score.fullTime.away) {
        result = 1; // Home win
      } else if (match.score.fullTime.home < match.score.fullTime.away) {
        result = 3; // Away win
      } else {
        result = 2; // Draw
      }
    }

    return Functions.encodeUint256(result);
  `;

  // Set the source codes
  await bettingContract.setMatchesSource(matchesSourceCode);
  console.log("Matches source code set");

  await bettingContract.setResultsSource(resultsSourceCode);
  console.log("Results source code set");

  console.log("Chainlink Functions setup completed!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
