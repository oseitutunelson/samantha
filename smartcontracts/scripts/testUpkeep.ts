import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "amoy",
  chainType: "l1",
});

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("👤 Using deployer:", deployer.address);

  // ⚠️ Replace with your deployed BettingContract address
  const contractAddress = "0xeCC7EFdaD35b246fF40d55FA68e68e829bE194Ac";

  // ✅ Get the contract
  const betting = await ethers.getContractAt("BettingContract", contractAddress);

  // ✅ Use .target for Ethers v6
  const deployedAddress = (betting as any).target ?? contractAddress;
  console.log("✅ Connected to BettingContract at:", deployedAddress);

  // 🕒 Check when the last match request was made
  const lastRequest = await betting.lastMatchRequestTime();
  console.log("⏰ Last request:", new Date(Number(lastRequest) * 1000).toLocaleString());

  // 🔍 Check upkeep status
  const [upkeepNeeded, performData] = await betting.checkUpkeep("0x");
  console.log("🔍 Upkeep needed:", upkeepNeeded);

  if (upkeepNeeded) {
    console.log("⚙️ Performing upkeep...");
    const tx = await betting.performUpkeep(performData);

    if (!tx) {
      throw new Error("❌ Failed to send upkeep transaction");
    }

    const receipt = await tx.wait();

    if (receipt) {
      console.log("✅ Upkeep performed — Tx hash:", receipt.hash);
    } else {
      console.warn("⚠️ Transaction pending, receipt is null. Try again later.");
    }
  } else {
    console.log("❌ Upkeep not needed at this time.");
  }

  // 📊 Query MatchesFetched events
  const events = await betting.queryFilter(betting.filters.MatchesFetched());
  console.log(`📊 Total MatchesFetched events: ${events.length}`);

  if (events.length > 0) {
    const lastEvent = events[events.length - 1];
    console.log("🟢 Last fetched matches:", lastEvent.args);
  }
}

main().catch((err) => {
  console.error("❌ Error running upkeep test:", err);
  process.exitCode = 1;
});
