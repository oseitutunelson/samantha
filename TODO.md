# TODO: Fix Error Requesting Matches

## Issue
- Transaction to `requestMatches()` fails with JSON-RPC error: Non-200 status code: '500'
- Likely due to insufficient gas limit (currently 300,000) for Chainlink Functions request

## Steps
- [x] Increase gasLimit in BettingContract.sol from 300000 to 500000
- [x] Redeploy BettingContract to Amoy network (address unchanged: 0x50cdF50Ca343d7D74c4094930F08299A5C8F930d)
- [x] Run setup-functions.ts to set source codes
- [ ] Test requestMatches function in frontend
- [ ] Verify Chainlink subscription is funded with LINK tokens
