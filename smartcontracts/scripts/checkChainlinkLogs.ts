import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "amoy",
  chainType: "l1",
});

async function main() {
  console.log("🔍 Checking Chainlink Functions logs...\n");

  const [owner] = await ethers.getSigners();
  const bettingContractAddress = "0x7EecC8E10B83222816499835820B7727fd6F046e";

  const BettingContract = await ethers.getContractFactory("BettingContract", owner);
  const bettingContract = BettingContract.attach(bettingContractAddress).connect(owner);

  // Get recent events
  const provider = owner.provider;
  if (!provider) {
    throw new Error("Provider is null");
  }
  const currentBlock = await provider.getBlockNumber();
  const fromBlock = currentBlock - 1000; // Last ~1000 blocks

  console.log(`📊 Scanning blocks ${fromBlock} to ${currentBlock}...\n`);

  // Check for Response events from FunctionsRouter
  const routerAddress = "0xC22a79eBA640940ABB6dF0f7982cc119578E11De";
  const routerAbi = [
    "event Response(bytes32 indexed requestId, bytes32 subscriptionId, uint96 totalCostJuels, address transmitter, uint8 resultCode, bytes response, bytes err, bytes callbackReturnData)"
  ];
  
  const router = new ethers.Contract(routerAddress, routerAbi, provider);

  try {
    const responseEvents = await router.queryFilter(
      router.filters.Response(),
      fromBlock,
      currentBlock
    );

    console.log(`Found ${responseEvents.length} Response events\n`);

    for (const event of responseEvents.slice(-5)) { // Last 5 events
      if ('args' in event) {
        console.log(`─────────────────────────────────────────`);
        console.log(`Block: ${event.blockNumber}`);
        console.log(`Request ID: ${event.args.requestId}`);
        console.log(`Result Code: ${event.args.resultCode} (0 = success)`);
        
        if (event.args.response && event.args.response !== "0x") {
          try {
            // Try to decode as string
            const decoded = ethers.AbiCoder.defaultAbiCoder().decode(["string"], event.args.response);
            console.log(`Response (string): "${decoded[0]}"`);
            console.log(`Response length: ${decoded[0].length} chars`);
          } catch {
            console.log(`Response (raw): ${event.args.response}`);
          }
        }
        
        if (event.args.err && event.args.err !== "0x") {
          console.log(`Error: ${ethers.toUtf8String(event.args.err)}`);
        }
        
        console.log("");
      }
    }

    // Also check MatchesFetched events from our contract
    console.log(`\n📨 Checking MatchesFetched events from contract...\n`);
    
    const matchesFetchedEvents = await bettingContract.queryFilter(
      bettingContract.filters.MatchesFetched(),
      fromBlock,
      currentBlock
    );

    console.log(`Found ${matchesFetchedEvents.length} MatchesFetched events`);
    
    if (matchesFetchedEvents.length > 0) {
      for (const event of matchesFetchedEvents.slice(-3)) {
        if ('args' in event) {
          console.log(`Block ${event.blockNumber}: MatchIds = [${event.args.matchIds}]`);
        }
      }
    } else {
      console.log("❌ No MatchesFetched events found!");
      console.log("\n💡 This means fulfillRequest() is failing silently or not emitting the event.");
    }

  } catch (error) {
    console.error("Error fetching events:", error);
  }

  // Show current contract state
  console.log("\n📊 Current Contract State:");
  const matchCount = await bettingContract.getMatchIdsLength();
  console.log(`   Matches stored: ${matchCount.toString()}`);
  
  console.log("\n💡 Next steps:");
  console.log("   1. Check the 'Response (string)' above to see what Chainlink returned");
  console.log("   2. If you see match data but no MatchesFetched events, the parsing is failing");
  console.log("   3. If you see 'NO_MATCHES', your API returned no data");
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exitCode = 1;
});