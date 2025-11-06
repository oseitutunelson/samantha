import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "amoy",
  chainType: "l1",
});

async function main() {
  console.log("Checking BettingContract state...");

  // Contract address from deployment
  const bettingContractAddress = "0xeCC7EFdaD35b246fF40d55FA68e68e829bE194Ac";

  // Get the deployed contract
  const BettingContract = await ethers.getContractFactory("BettingContract");
  const bettingContract = BettingContract.attach(bettingContractAddress);

  try {
    const subscriptionId = await bettingContract.subscriptionId();
    console.log("Subscription ID:", subscriptionId.toString());

    const donId = await bettingContract.donId();
    console.log("DON ID:", donId);

    const matchesSource = await bettingContract.matchesSourceCode();
    console.log("Matches source code set:", matchesSource.length > 0);

    const resultsSource = await bettingContract.resultsSourceCode();
    console.log("Results source code set:", resultsSource.length > 0);

    const lastTime = await bettingContract.lastMatchRequestTime();
    console.log("Last match request time:", new Date(Number(lastTime) * 1000).toISOString());

    const matchIdsLength = await bettingContract.getMatchIdsLength();
    console.log("Number of match IDs:", matchIdsLength.toString());

    const owner = await bettingContract.owner();
    console.log("Contract owner:", owner);

    const signers = await ethers.getSigners();
    const signer = signers[0];
    console.log("Current signer:", signer.address);
    console.log("Is owner:", owner.toLowerCase() === signer.address.toLowerCase());

  } catch (error) {
    console.error("Error checking contract state:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
