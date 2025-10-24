import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "amoy",
  chainType: "l1",
});

async function main() {
  console.log("Deploying Betting Platform contracts...");

  // Deploy USDT
  const USDT = await ethers.getContractFactory("USDT");
  const usdt = await USDT.deploy();
  await usdt.waitForDeployment();
  console.log("USDT deployed to:", await usdt.getAddress());

  // Deploy BettingToken
  const BettingToken = await ethers.getContractFactory("BettingToken");
  const bettingToken = await BettingToken.deploy();
  await bettingToken.waitForDeployment();
  console.log("BettingToken deployed to:", await bettingToken.getAddress());

  // Deploy BetTicketNFT
  const BetTicketNFT = await ethers.getContractFactory("BetTicketNFT");
  const betTicketNFT = await BetTicketNFT.deploy();
  await betTicketNFT.waitForDeployment();
  console.log("BetTicketNFT deployed to:", await betTicketNFT.getAddress());

  // Chainlink configuration for Polygon Amoy
  const routerAddress = "0xC22a79eBA640940ABB6dF0f7982cc119578E11De"; // Amoy Functions Router
  const subscriptionId = 489; // Replace with your actual subscription ID
  const donId = ethers.encodeBytes32String("fun-polygon-amoy-1"); // Amoy DON ID

  console.log("Router Address:", routerAddress);
  console.log("Subscription ID:", subscriptionId);
  console.log("DON ID:", donId);

  // Deploy BettingContract
  const BettingContract = await ethers.getContractFactory("BettingContract");
  const bettingContract = await BettingContract.deploy(
    routerAddress,
    subscriptionId,
    donId,
    await bettingToken.getAddress(),
    await betTicketNFT.getAddress(),
    await usdt.getAddress()
  );
  await bettingContract.waitForDeployment();
  console.log("BettingContract deployed to:", await bettingContract.getAddress());

  // Transfer ownership of tokens to BettingContract
  await bettingToken.transferOwnership(await bettingContract.getAddress());
  await betTicketNFT.transferOwnership(await bettingContract.getAddress());

  console.log("Deployment completed!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
