import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "amoy",
  chainType: "l1",
});

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Minting USDT to deployer address:", deployer.address);

  // Replace with the actual deployed USDT contract address from deploy.ts output
  const usdtAddress = "0x6caea8E4D5Fbfa00b0a2e9645a86e489926fe6c6"; // Update this after deployment

  const USDT = await ethers.getContractAt("USDT", usdtAddress);

  // Mint 1000 USDT (assuming 18 decimals, adjust if needed)
  const amount = ethers.parseEther("1000"); // 1000 * 10^18
  await USDT.mint(deployer.address, amount);

  console.log(`Minted ${amount} USDT to ${deployer.address}`);
  console.log("USDT balance:", await USDT.balanceOf(deployer.address));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
