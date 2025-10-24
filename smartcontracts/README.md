# EPL Betting Platform on Polygon Amoy

This project implements a decentralized betting platform for English Premier League (EPL) matches using Chainlink Functions and Automation on the Polygon Amoy testnet.

## Features

- **Betting on EPL Matches**: Users can place bets on match outcomes (home win, draw, away win).
- **NFT Bet Tickets**: Each bet is minted as a unique ERC721 NFT storing bet details.
- **Reward Token**: ERC20 token for rewarding winning bettors.
- **Chainlink Functions**: Fetches daily EPL matches, odds, and results from football-data.org API.
- **Chainlink Automation**: Automatically resolves bets and distributes rewards.

## Contracts

- `BettingToken.sol`: ERC20 token for rewards.
- `BetTicketNFT.sol`: ERC721 NFT for bet tickets.
- `BettingContract.sol`: Main betting logic with Chainlink integrations.

## Setup

### Prerequisites

- Node.js and npm
- Hardhat
- Polygon Amoy RPC URL and private key
- Football-data.org API key

### Environment Variables

Create a `.env` file in the root directory with:

```
AMOY_RPC_URL=your_amoy_rpc_url
AMOY_PRIVATE_KEY=your_amoy_private_key
FOOTBALL_DATA_API_KEY=your_api_key
```

### Installation

```shell
cd smartcontracts
npm install
```

### Configuration

1. Update `hardhat.config.ts` with your Amoy network details (already configured).
2. Run the setup script to generate Chainlink Functions source code:

```shell
npx hardhat run scripts/setup-functions.ts
```

3. Manually configure Chainlink Functions on Amoy testnet:
   - Create a subscription
   - Upload the generated source codes
   - Set secrets (API key)
   - Fund the subscription

4. Update the subscription ID in `scripts/deploy.ts`.

### Deployment

Deploy all contracts to Amoy:

```shell
npx hardhat run scripts/deploy.ts --network amoy
```

### Testing

Run the test suite:

```shell
npx hardhat test
```

## Usage

1. **Fetch Matches**: Call `requestMatches()` to fetch today's EPL matches via Chainlink Functions.
2. **Place Bets**: Users approve BettingToken spending and call `placeBet(matchId, prediction, amount)`.
3. **Automatic Resolution**: Chainlink Automation checks for completed matches and triggers result fetching.
4. **Claim Rewards**: Winning bettors call `claimReward(tokenId)` to receive payouts.

## Chainlink Integration

- **Functions**: Used for off-chain API calls to football-data.org.
- **Automation**: Performs upkeep to resolve bets after matches end.

## Security Considerations

- This is a testnet implementation. Thorough auditing required for mainnet.
- API key is stored as a secret in Chainlink Functions.
- Owner controls for setting source codes and managing the platform.
