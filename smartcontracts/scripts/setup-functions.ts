import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "amoy",
  chainType: "l1",
});

async function main() {
  console.log("Setting up Chainlink Functions...");

  // Contract addresses from deployment
  const bettingContractAddress = "0xeCC7EFdaD35b246fF40d55FA68e68e829bE194Ac";

  // Get the deployed contract
  const BettingContract = await ethers.getContractFactory("BettingContract");
  const bettingContract = BettingContract.attach(bettingContractAddress);

  // JavaScript source code for fetching matches
  const matchesSourceCode = `
  const API_KEY = "d752945a57514a439d2fa74e8b2db2ae"; 
    const date = new Date().toISOString().split("T")[0]; // today's date
    const url = \`https://api.football-data.org/v4/competitions/PL/matches?dateFrom=\${date}&dateTo=\${date}\`;

    const headers = { "X-Auth-Token": API_KEY };

    const response = await Functions.makeHttpRequest({
      url,
      headers,
    });

    if (!response || !response.data) {
      throw new Error("API request failed");
    }

    const matches = response.data.matches;
    if (!matches || matches.length === 0) {
      throw new Error("No matches found today");
    }

    // Generate compact odds (random for now)
    const results = matches.slice(0, 5).map((match) => {
      const home = match.homeTeam.shortName;
      const away = match.awayTeam.shortName;
      const matchId = match.id;

      // Custom random odds
      const homeOdds = (Math.random() * 2 + 1).toFixed(2);
      const drawOdds = (Math.random() * 2 + 2).toFixed(2);
      const awayOdds = (Math.random() * 2 + 1).toFixed(2);

      return \`\${matchId}:\${home}(\${homeOdds})-Draw(\${drawOdds})-\${away}(\${awayOdds})\`;
    });

    // Compress data to stay under 256 bytes
    const compact = results.join("|").slice(0, 250);

    return Functions.encodeString(compact);
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
