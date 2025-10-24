# TODO: Build EPL Betting Platform on Polygon Amoy with Chainlink

## Step 1: Update Hardhat Configuration
- [x] Edit `smartcontracts/hardhat.config.ts` to add Polygon Amoy network config using env variables (AMOY_RPC_URL, AMOY_PRIVATE_KEY).

## Step 2: Update Package Dependencies
- [x] Edit `smartcontracts/package.json` to add Chainlink dependencies: `@chainlink/contracts`, `@chainlink/functions-toolkit`, `@chainlink/automation-toolkit`.
- [x] Run `npm install` in `smartcontracts/` to install new deps.

## Step 3: Create BettingToken.sol
- [x] Create `smartcontracts/contracts/BettingToken.sol` as an ERC20 token for rewards (mintable, transferable).

## Step 4: Create BetTicketNFT.sol
- [x] Create `smartcontracts/contracts/BetTicketNFT.sol` as an ERC721 NFT for bet tickets (stores bet details like match ID, prediction, amount).

## Step 5: Create BettingContract.sol
- [x] Create `smartcontracts/contracts/BettingContract.sol` for main betting logic:
  - Integrate Chainlink Functions to fetch daily EPL matches, odds, and results from football-data.org API.
  - Allow placing bets (mint NFT tickets).
  - Use Chainlink Automation for automatic bet resolution and payouts using BettingToken.

## Step 6: Create Deployment Script
- [x] Create `smartcontracts/scripts/deploy.ts` to deploy all contracts and set up Chainlink integrations.

## Step 7: Create Functions Setup Script
- [x] Create `smartcontracts/scripts/setup-functions.ts` to configure Chainlink Functions for API calls.

## Step 8: Create Tests
- [x] Create `smartcontracts/test/BettingPlatform.ts` to test betting logic, NFT minting, token rewards, and Chainlink integrations.

## Step 9: Update README
- [x] Edit `smartcontracts/README.md` with setup instructions, env vars, API key, and deployment steps.

## Step 10: Deploy and Test
- [x] Compile contracts successfully.
- [ ] Deploy contracts on Polygon Amoy testnet.
- [ ] Set up Chainlink Functions subscription and Automation upkeep.
- [ ] Test API integration with football-data.org.
- [ ] Verify automation triggers and bet resolutions.

## Step 11: Integrate Betting UI into React App
- [x] Create WalletConnect.jsx component for MetaMask connection.
- [x] Create BettingDashboard.jsx as main betting interface.
- [x] Create MatchList.jsx to display available matches.
- [x] Create BetForm.jsx for placing bets on matches.
- [x] Create Results.jsx for viewing match results and claiming rewards.
- [x] Update src/App.jsx to include betting components in the UI layout.
- [ ] Test wallet connection and contract interactions locally.
- [ ] Test Chainlink Functions via Chainlink's UI for JS code verification.
- [ ] Deploy UI and test on Polygon Amoy testnet.
- [ ] Verify Chainlink Functions trigger and data displays correctly in UI.
