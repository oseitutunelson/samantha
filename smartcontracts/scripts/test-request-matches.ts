import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "amoy",
  chainType: "l1",
});

async function main() {
  console.log("Testing Chainlink Functions by requesting matches...");

  // Contract address from deployment
  const bettingContractAddress = "0x4B8edD154ff565E5972AaAe52d5607FbCf6BAeE0";

  // Get the deployed contract
  const BettingContract = await ethers.getContractFactory("BettingContract");
  const bettingContract = BettingContract.attach(bettingContractAddress);

  console.log("Checking last request time...");
  try {
    const lastTime = await bettingContract.lastMatchRequestTime();
    console.log("Last match request time:", new Date(Number(lastTime) * 1000).toISOString());

    const interval = await bettingContract.MATCH_REQUEST_INTERVAL();
    console.log("Request interval:", Number(interval) / 3600, "hours");

    const currentTime = Math.floor(Date.now() / 1000);
    console.log("Current time:", new Date(currentTime * 1000).toISOString());

    if (currentTime < Number(lastTime) + Number(interval)) {
      console.log("Too soon to request matches. Waiting for next interval.");
      return;
    }

    console.log("Requesting matches...");
    try {
      const tx = await bettingContract.requestMatches();
      console.log("Transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("Matches requested successfully!");
      console.log("Gas used:", receipt.gasUsed.toString());
    } catch (error) {
      console.error("Error requesting matches:", error);

      // Try to get more details about the error
      if (error.data) {
        console.log("Error data:", error.data);
        // Try to decode the error
        try {
          const decoded = bettingContract.interface.parseError(error.data);
          console.log("Decoded error:", decoded);
        } catch (decodeError) {
          console.log("Could not decode error data");
        }
      }
    }
  } catch (error) {
    console.error("Error requesting matches:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
