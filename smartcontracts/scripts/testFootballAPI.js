// Test script to check if the Football API is returning data
const API_KEY = "d752945a57514a439d2fa74e8b2db2ae";

if (!API_KEY) {
  console.error(" FOOTBALL_API_KEY not found in environment");
  process.exit(1);
}

const today = new Date();
const dateFrom = today.toISOString().split("T")[0];
    const future = new Date();
    future.setDate(today.getDate() + 14);
const dateTo = future.toISOString().split("T")[0];
console.log(`  Checking matches for: ${dateFrom}`);

const url = `https://api.football-data.org/v4/competitions/PL/matches?dateFrom=${dateFrom}&dateTo=${dateTo}&status=SCHEDULED`;

fetch(url, {
  headers: { "X-Auth-Token": API_KEY }
})
  .then(res => res.json())
  .then(data => {
    console.log("\n📊 API Response:");
    console.log(`Total matches: ${data.matches?.length || 0}`);
    
    if (data.matches && data.matches.length > 0) {
      console.log("\n⚽ Today's Matches:");
      data.matches.forEach((match, i) => {
        console.log(`${i + 1}. ${match.homeTeam.name} vs ${match.awayTeam.name}`);
        console.log(`   ID: ${match.id}`);
        console.log(`   Date: ${match.utcDate}`);
        console.log(`   Status: ${match.status}`);
      });
    } else {
      console.log("\n⚠️  No matches scheduled for today");
      console.log("This is why your Chainlink Function returns NO_MATCHES");
      console.log("\n💡 Try checking a different date or competition");
    }
  })
  .catch(error => {
    console.error("❌ Error:", error.message);
  });