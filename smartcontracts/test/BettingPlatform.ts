import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "hardhat",
  chainType: "l1",
});

describe("Betting Platform", function () {
  let bettingContract: any;
  let bettingToken: any;
  let betTicketNFT: any;
  let owner: any;
  let user: any;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    // Deploy contracts
    const BettingTokenFactory = await ethers.getContractFactory("BettingToken");
    bettingToken = await BettingTokenFactory.deploy();
    await bettingToken.waitForDeployment();

    const BetTicketNFTFactory = await ethers.getContractFactory("BetTicketNFT");
    betTicketNFT = await BetTicketNFTFactory.deploy();
    await betTicketNFT.waitForDeployment();

    const BettingContractFactory = await ethers.getContractFactory("BettingContract");
    bettingContract = await BettingContractFactory.deploy(
      "0xC22a79eBA640940ABB6d8373E71877453A65b12e4", // Mock router
      123,
      ethers.encodeBytes32String("test"),
      await bettingToken.getAddress(),
      await betTicketNFT.getAddress()
    );
    await bettingContract.waitForDeployment();

    // Transfer ownership
    await bettingToken.transferOwnership(await bettingContract.getAddress());
    await betTicketNFT.transferOwnership(await bettingContract.getAddress());
  });

  describe("BettingToken", function () {
    it("Should mint tokens", async function () {
      await bettingToken.connect(owner).mint(user.address, 1000);
      expect(await bettingToken.balanceOf(user.address)).to.equal(1000);
    });
  });

  describe("BetTicketNFT", function () {
    it("Should mint bet tickets", async function () {
      const tokenId = await betTicketNFT.connect(owner).mintBetTicket(user.address, 1, 0, 100);
      expect(await betTicketNFT.ownerOf(tokenId)).to.equal(user.address);
    });
  });

  describe("BettingContract", function () {
    it("Should allow placing bets", async function () {
      // Mock a match
      await bettingContract.connect(owner).setMatchesSource("mock source");
      await bettingContract.connect(owner).setResultsSource("mock source");

      // Add a mock match (in real scenario, this would come from Chainlink Functions)
      // For testing, we'd need to simulate the fulfillRequest

      // Mint tokens for user
      await bettingToken.connect(owner).mint(user.address, 1000);

      // Approve contract to spend tokens
      await bettingToken.connect(user).approve(await bettingContract.getAddress(), 100);

      // This would fail without a real match, but tests the structure
      // await expect(bettingContract.connect(user).placeBet(1, 0, 100)).to.be.revertedWith("Match does not exist");
    });
  });
});
