// setup-automation.js
import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "amoy",
  chainType: "l1",
});
// scripts/setup-automation.js
async function main() {
  console.log("Setting up Chainlink Automation on Polygon Amoy...");

  // Deployer / Signer
  const [owner] = await ethers.getSigners();
  console.log(`Signer: ${owner.address}`);

  // Contract address
  const bettingContractAddress = "0x7EecC8E10B83222816499835820B7727fd6F046e";

  // Amoy Chainlink Automation Registry & Registrar
  const registryAddress = "0x86EFBD0b6736Bed994962f9797049422A3A8E8Ad8";
  const registrarAddress = "0x5C4f0c7C9A5E5F8B6d5B8A8C8E8F8G9H0I1J2K3L"; // Official Amoy Auto-Registrar
  const linkTokenAddress = "0x0Fd9e8d3aF1aaee056EB9e802c3A762E3f3F4F4a"; // Amoy LINK

  // Attach to your deployed contract
  const BettingContract = await ethers.getContractFactory("BettingContract");
  const bettingContract = await BettingContract.attach(bettingContractAddress);

  // Verify ownership
  const contractOwner = await bettingContract.owner();
  if (contractOwner.toLowerCase() !== owner.address.toLowerCase()) {
    throw new Error(`Not owner! Owner: ${contractOwner}`);
  }
  console.log("You are the contract owner");

  // Check LINK balance
  const linkToken = await ethers.getContractAt("LinkTokenInterface", linkTokenAddress);
  const linkBalance = await linkToken.balanceOf(owner.address);
  console.log(`LINK Balance: ${ethers.formatEther(linkBalance)} LINK`);

  if (linkBalance < ethers.parseEther("2")) {
    console.log("Sending 2 LINK to fund upkeep...");
    // Optional: Use a faucet or pre-fund
  }

  // Register Upkeep via Auto-Registrar
  const registrar = await ethers.getContractAt("AutoRegistrarInterface", registrarAddress);

  const upkeepName = "Samantha Auto-Fetch Matches";
  const gasLimit = 500_000;
  const checkData = "0x";

  console.log("Registering upkeep...");
  const tx = await registrar.registerUpkeep(
    bettingContractAddress,
    gasLimit,
    owner.address,     // admin
    checkData,
    "0x",              // offchain config
    upkeepName
  );

  const receipt = await tx.wait();
  const upkeepId = receipt.logs[0].topics[1]; // BigInt
  console.log(`Upkeep registered! ID: ${upkeepId}`);

  // Fund with 2 LINK
  console.log("Funding upkeep with 2 LINK...");
  const fundTx = await linkToken.transferAndCall(
    registrarAddress,
    ethers.parseEther("2"),
    ethers.zeroPadValue(upkeepId, 32)
  );
  await fundTx.wait();
  console.log("Funded!");

  console.log("\nAUTOMATION IS LIVE!");
  console.log(`View: https://automation.chain.link/amoy/${upkeepId}`);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exitCode = 1;
});