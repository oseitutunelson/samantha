// complete-automation.js
// This script does EVERYTHING: Request → Wait → Parse → Add Matches

import cron from 'node-cron';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const CONFIG = {
  RPC_URL: process.env.AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology',
  PRIVATE_KEY: process.env.AMOY_PRIVATE_KEY,
  CONTRACT_ADDRESS: '0x513EC06a093b9c027e07Ed00427A5269d1E0F4B9',
  SCHEDULE: '0 6 * * *', // Daily at 6 AM
};

// Complete Contract ABI
const ABI = [
  'function requestMatches() public',
  'function getMatchIdsLength() public view returns (uint256)',
  'function lastChainlinkResponse() public view returns (string)',
  'function clearMatches() public',
  'function addMatch(uint256 id, string calldata homeTeam, string calldata awayTeam, uint256 matchDate, uint256 homeOdd, uint256 drawOdd, uint256 awayOdd) external',
  'function finalizeMatches() external',
  'event MatchesFetched(uint256[] matchIds)',
  'event ChainlinkResponseReceived(string response)'
];

class CompleteAutomation {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    this.wallet = new ethers.Wallet(CONFIG.PRIVATE_KEY, this.provider);
    this.contract = new ethers.Contract(
      CONFIG.CONTRACT_ADDRESS,
      ABI,
      this.wallet
    );
  }

  async checkConnection() {
    try {
      const network = await this.provider.getNetwork();
      const balance = await this.provider.getBalance(this.wallet.address);
      console.log('✅ Connected to network:', network.name);
      console.log('📍 Wallet address:', this.wallet.address);
      console.log('💰 Balance:', ethers.formatEther(balance), 'MATIC');
      return parseFloat(ethers.formatEther(balance)) > 0.01;
    } catch (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }
  }

  async getCurrentMatchCount() {
    try {
      const count = await this.contract.getMatchIdsLength();
      return Number(count);
    } catch (error) {
      console.error('Error getting match count:', error.message);
      return 0;
    }
  }

  // Step 1: Request matches from Chainlink
  async requestMatchesFromChainlink() {
    console.log('\n📡 Step 1: Requesting matches from Chainlink...');
    
    try {
      const tx = await this.contract.requestMatches();
      console.log('⏳ Transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
      
      return true;
    } catch (error) {
      console.error('❌ Request failed:', error.message);
      return false;
    }
  }

  // Step 2: Wait for Chainlink callback and get response
  async waitAndGetChainlinkResponse(maxWaitTime = 90000) {
    console.log('\n⏳ Step 2: Waiting for Chainlink response (up to 90 seconds)...');
    
    const startTime = Date.now();
    let lastResponse = '';
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const response = await this.contract.lastChainlinkResponse();
        
        if (response && response !== lastResponse && response.length > 0) {
          console.log('✅ Got Chainlink response!');
          console.log('📥 Response:', response);
          return response;
        }
        
        // Wait 5 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 5000));
        process.stdout.write('.');
      } catch (error) {
        console.error('\n⚠️ Error checking response:', error.message);
      }
    }
    
    console.log('\n⚠️ Timeout waiting for Chainlink response');
    return null;
  }

  // Step 3: Parse the Chainlink response
  parseChainlinkResponse(response) {
    console.log('\n🔍 Step 3: Parsing Chainlink response...');
    
    if (!response || response.length === 0) {
      console.log('❌ No response to parse');
      return [];
    }

    // Parse: "537898:Burnley(1.38)-Draw(3.45)-Chelsea(1.16)|537895:..."
    const matchStrings = response.split('|');
    console.log(`📊 Found ${matchStrings.length} matches to parse`);

    const matches = [];

    for (let i = 0; i < matchStrings.length; i++) {
      const matchStr = matchStrings[i].trim();
      
      try {
        // Parse: "537898:Burnley(1.38)-Draw(3.45)-Chelsea(1.16)"
        const [idPart, rest] = matchStr.split(':');
        const id = BigInt(idPart);

        const parts = rest.split('-');

        // Parse home: "Burnley(1.38)"
        const homeMatch = parts[0].match(/^(.+?)\(([0-9.]+)\)$/);
        const home = homeMatch ? homeMatch[1] : 'Team A';
        const hOdds = homeMatch ? Math.round(parseFloat(homeMatch[2]) * 100) : 200;

        // Parse draw: "Draw(3.45)"
        const drawMatch = parts[1].match(/\(([0-9.]+)\)$/);
        const dOdds = drawMatch ? Math.round(parseFloat(drawMatch[1]) * 100) : 300;

        // Parse away: "Chelsea(1.16)"
        const awayMatch = parts[2].match(/^(.+?)\(([0-9.]+)\)$/);
        const away = awayMatch ? awayMatch[1] : 'Team B';
        const aOdds = awayMatch ? Math.round(parseFloat(awayMatch[2]) * 100) : 200;

        // Match date: current time + (i+1) days
        const matchDate = BigInt(Math.floor(Date.now() / 1000) + (i + 1) * 86400);

        matches.push({
          id,
          home,
          away,
          matchDate,
          hOdds,
          dOdds,
          aOdds
        });

        console.log(`  ${i + 1}. ${home} vs ${away}`);
        console.log(`     ID: ${id}, Odds: ${hOdds/100}x / ${dOdds/100}x / ${aOdds/100}x`);
      } catch (error) {
        console.error(`  ❌ Failed to parse match ${i + 1}:`, matchStr);
        console.error(`     Error:`, error.message);
      }
    }

    console.log(`\n✅ Successfully parsed ${matches.length} matches`);
    return matches;
  }

  // Step 4: Clear old matches
  async clearOldMatches() {
    console.log('\n🗑️  Step 4: Clearing old matches...');
    
    try {
      const tx = await this.contract.clearMatches();
      await tx.wait();
      console.log('✅ Old matches cleared');
      return true;
    } catch (error) {
      console.error('❌ Failed to clear matches:', error.message);
      return false;
    }
  }

  // Step 5: Add matches to contract one by one
  async addMatchesToContract(matches) {
    console.log(`\n📤 Step 5: Adding ${matches.length} matches to contract...`);
    
    let successCount = 0;
    
    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      
      try {
        console.log(`  Adding match ${i + 1}/${matches.length}: ${m.home} vs ${m.away}...`);
        
        const tx = await this.contract.addMatch(
          m.id,
          m.home,
          m.away,
          m.matchDate,
          m.hOdds,
          m.dOdds,
          m.aOdds
        );
        
        await tx.wait();
        console.log(`  ✅ Added`);
        successCount++;
        
      } catch (error) {
        console.error(`  ❌ Failed to add match ${i + 1}:`, error.message);
      }
    }
    
    console.log(`\n✅ Added ${successCount}/${matches.length} matches`);
    return successCount;
  }

  // Step 6: Finalize matches
  async finalizeMatches() {
    console.log('\n🎯 Step 6: Finalizing matches...');
    
    try {
      const tx = await this.contract.finalizeMatches();
      await tx.wait();
      console.log('✅ Matches finalized - MatchesFetched event emitted');
      return true;
    } catch (error) {
      console.error('❌ Failed to finalize:', error.message);
      return false;
    }
  }

  // Main automation flow
  async runCompleteAutomation() {
    console.log('\n' + '='.repeat(60));
    console.log('🤖 COMPLETE MATCH AUTOMATION - STARTING');
    console.log('='.repeat(60));
    console.log('⏰ Time:', new Date().toISOString());

    try {
      // Check connection
      const connected = await this.checkConnection();
      if (!connected) {
        console.error('\n❌ Insufficient balance or connection failed');
        return false;
      }

      // Check current match count
      const currentCount = await this.getCurrentMatchCount();
      console.log(`\n📊 Current matches in contract: ${currentCount}`);

      // Step 1: Request from Chainlink
      const requestSuccess = await this.requestMatchesFromChainlink();
      if (!requestSuccess) {
        console.error('\n❌ Failed to request matches from Chainlink');
        return false;
      }

      // Step 2: Wait for response
      const response = await this.waitAndGetChainlinkResponse();
      if (!response) {
        console.error('\n❌ No response received from Chainlink');
        console.log('💡 Tip: Check your Chainlink subscription has LINK');
        console.log('💡 Tip: Verify your API key is valid');
        return false;
      }

      // Step 3: Parse response
      const matches = this.parseChainlinkResponse(response);
      if (matches.length === 0) {
        console.error('\n❌ No matches parsed from response');
        return false;
      }

      // Step 4: Clear old matches
      const clearSuccess = await this.clearOldMatches();
      if (!clearSuccess) {
        console.error('\n⚠️ Warning: Could not clear old matches, continuing anyway...');
      }

      // Step 5: Add matches
      const addedCount = await this.addMatchesToContract(matches);
      if (addedCount === 0) {
        console.error('\n❌ Failed to add any matches');
        return false;
      }

      // Step 6: Finalize
      const finalizeSuccess = await this.finalizeMatches();
      if (!finalizeSuccess) {
        console.error('\n⚠️ Warning: Could not finalize, but matches are added');
      }

      // Verify
      const newCount = await this.getCurrentMatchCount();
      console.log(`\n📊 Final match count: ${newCount}`);

      console.log('\n' + '='.repeat(60));
      console.log('🎉 AUTOMATION COMPLETED SUCCESSFULLY!');
      console.log('='.repeat(60));
      console.log(`✅ Added ${newCount} matches to contract`);
      console.log('💡 Your frontend will now show the new matches!');
      console.log('='.repeat(60) + '\n');

      return true;

    } catch (error) {
      console.error('\n❌ Automation failed with error:', error.message);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
      return false;
    }
  }

  async runOnce() {
    await this.runCompleteAutomation();
    process.exit(0);
  }

  async startScheduled() {
    console.log('\n' + '='.repeat(60));
    console.log('🤖 COMPLETE AUTOMATION - SCHEDULER STARTED');
    console.log('='.repeat(60));
    console.log(`📅 Schedule: ${CONFIG.SCHEDULE} (cron format)`);
    console.log(`📍 Contract: ${CONFIG.CONTRACT_ADDRESS}`);
    console.log('='.repeat(60) + '\n');

    // Check connection first
    const connected = await this.checkConnection();
    if (!connected) {
      console.error('❌ Exiting due to connection failure or insufficient balance');
      process.exit(1);
    }

    // Run once immediately on startup
    console.log('🚀 Running initial automation...');
    await this.runCompleteAutomation();

    // Schedule daily runs
    cron.schedule(CONFIG.SCHEDULE, async () => {
      console.log('\n⏰ Scheduled run triggered');
      await this.runCompleteAutomation();
    });

    console.log('\n✅ Scheduler is now running');
    console.log('💡 The script will automatically fetch and add matches according to schedule');
    console.log('⚠️  Press Ctrl+C to stop\n');
  }
}

// CLI Interface
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  if (!CONFIG.PRIVATE_KEY) {
    console.error('❌ PRIVATE_KEY not found in environment variables');
    console.error('💡 Create a .env file with: PRIVATE_KEY=your_private_key');
    process.exit(1);
  }

  const automation = new CompleteAutomation();

  switch (command) {
    case 'start':
    case 'schedule':
      await automation.startScheduled();
      break;
    
    case 'once':
    case 'now':
      await automation.runOnce();
      break;
    
    default:
      console.log(`
🎯 Complete Match Automation

This script does EVERYTHING automatically:
1. Requests matches from Chainlink
2. Waits for Chainlink response
3. Parses the response
4. Clears old matches
5. Adds new matches to contract
6. Finalizes (emits MatchesFetched event)

Usage:
  node complete-automation.js <command>

Commands:
  start, schedule    Start the scheduler (runs daily)
  once, now         Run complete automation once then exit

Examples:
  node complete-automation.js start     # Start daily scheduler
  node complete-automation.js once      # Run now (testing)
      `);
      process.exit(0);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});