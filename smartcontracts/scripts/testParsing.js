// Test the parsing logic with the actual Chainlink response
// Replace this with the EXACT string from Chainlink UI "Computation result"
const chainlinkResponse = "537898:Burnley(1.38)-Draw(3.45)-Chelsea(1.16)|537895:Bournemouth(1.96)-Draw(3.21)-WestHam(1.52)|537896:BrightonHove(2.44)-Draw(3.35)-Brentford(2.20)|537899:Fulham(2.27)-Draw(3.31)-Sunderland(2.19)|537900:Liverpool(2.91)-Draw(3.32)-Nottingham(2.54)";

console.log("🧪 Testing parsing logic...\n");
console.log("Input string:");
console.log(chainlinkResponse);
console.log(`Length: ${chainlinkResponse.length} characters\n`);

// Split by pipe
const matches = chainlinkResponse.split("|");
console.log(`Found ${matches.length} match(es):\n`);

for (let i = 0; i < matches.length; i++) {
  const matchStr = matches[i];
  console.log(`Match ${i + 1}: "${matchStr}"`);
  
  try {
    // Expected format: "12345:Arsenal(1.50)-Draw(3.00)-Chelsea(2.20)"
    
    // Find colon
    const colonIndex = matchStr.indexOf(":");
    if (colonIndex === -1) {
      console.log("  ❌ No colon found!");
      continue;
    }
    
    // Extract ID
    const id = matchStr.substring(0, colonIndex);
    console.log(`  ID: ${id}`);
    
    // Extract rest
    const rest = matchStr.substring(colonIndex + 1);
    console.log(`  Rest: "${rest}"`);
    
    // Split by dash
    const parts = rest.split("-");
    console.log(`  Parts: ${parts.length} (expected 3)`);
    
    if (parts.length < 3) {
      console.log("  ❌ Not enough parts!");
      continue;
    }
    
    // Parse home team and odds
    const homePart = parts[0]; // "Arsenal(1.50)"
    const homeParenIndex = homePart.indexOf("(");
    if (homeParenIndex === -1) {
      console.log("  ❌ No opening parenthesis in home part!");
      continue;
    }
    const homeTeam = homePart.substring(0, homeParenIndex);
    const homeOddsStr = homePart.substring(homeParenIndex + 1, homePart.length - 1);
    console.log(`  Home: ${homeTeam}, Odds: ${homeOddsStr}`);
    
    // Parse draw odds
    const drawPart = parts[1]; // "Draw(3.00)"
    const drawParenIndex = drawPart.indexOf("(");
    const drawOddsStr = drawPart.substring(drawParenIndex + 1, drawPart.length - 1);
    console.log(`  Draw Odds: ${drawOddsStr}`);
    
    // Parse away team and odds
    const awayPart = parts[2]; // "Chelsea(2.20)"
    const awayParenIndex = awayPart.indexOf("(");
    if (awayParenIndex === -1) {
      console.log("  ❌ No opening parenthesis in away part!");
      continue;
    }
    const awayTeam = awayPart.substring(0, awayParenIndex);
    const awayOddsStr = awayPart.substring(awayParenIndex + 1, awayPart.length - 1);
    console.log(`  Away: ${awayTeam}, Odds: ${awayOddsStr}`);
    
    console.log("  ✅ Parsing successful!\n");
    
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}\n`);
  }
}

console.log("\n💡 If any match shows errors above, that's what's breaking your contract!");
console.log("Common issues:");
console.log("  - Team names with special characters");
console.log("  - Missing dashes or parentheses");
console.log("  - Extra spaces or newlines");