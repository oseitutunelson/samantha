// automated-match-fetcher.js
// This script automatically fetches matches daily via Chainlink Functions

import cron from 'node-cron';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const CONFIG = {
  RPC_URL: process.env.AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology',
  PRIVATE_KEY: process.env.AMOY_PRIVATE_KEY,
  CONTRACT_ADDRESS: '0x8A147A05A6DEC51f89b0e3aa836725802977D83a',
  SCHEDULE: '0 */6 * * *', 
};

 const ABI = [
  'function requestMatches() public',
  'function getMatchIdsLength() public view returns (uint256)',
  'function lastChainlinkResponse() public view returns (string)',
  'event MatchesFetched(uint256[] matchIds)',
  'event ChainlinkResponseReceived(string response)',
  'event ParseError(string reason, string data)'
];

class AutomatedMatchFetcher {
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
      return true;
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

  async requestNewMatches() {
    console.log('\n🚀 Starting match fetch request...');
    console.log('⏰ Time:', new Date().toISOString());

    try {
      // Check current match count
      const currentCount = await this.getCurrentMatchCount();
      console.log(`📊 Current matches in contract: ${currentCount}`);

      // Send request
      console.log('📡 Sending Chainlink Functions request...');
      const tx = await this.contract.requestMatches();
      console.log('⏳ Transaction sent:', tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed in block:', receipt.blockNumber);

      // Wait for Chainlink callback (typically 30-60 seconds)
      console.log('⏳ Waiting for Chainlink callback (60 seconds)...');
      await this.waitForCallback(60000);

      // Check if matches were updated
      const newCount = await this.getCurrentMatchCount();
      console.log(`📊 Updated match count: ${newCount}`);

      if (newCount > currentCount) {
        console.log(`✅ Successfully added ${newCount - currentCount} new matches!`);
        await this.logResponse();
      } else if (newCount === currentCount) {
        console.log('⚠️ No new matches added. Checking logs...');
        await this.logResponse();
      }

      return true;
    } catch (error) {
      console.error('❌ Request failed:', error.message);
      if (error.reason) console.error('Reason:', error.reason);
      return false;
    }
  }

  async waitForCallback(timeout) {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve();
      }, timeout);

      // Listen for events
      this.contract.once('MatchesFetched', () => {
        clearTimeout(timer);
        console.log('🎉 MatchesFetched event received!');
        resolve();
      });
    });
  }

  async logResponse() {
    try {
      const response = await this.contract.lastChainlinkResponse();
      if (response) {
        console.log('\n📥 Last Chainlink Response:');
        console.log(response);
      }
    } catch (error) {
      console.error('Could not retrieve response:', error.message);
    }
  }

  async runOnce() {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 AUTOMATED MATCH FETCHER - MANUAL RUN');
    console.log('='.repeat(60));

    const connected = await this.checkConnection();
    if (!connected) {
      console.error('❌ Cannot proceed without connection');
      return;
    }

    await this.requestNewMatches();
    console.log('\n' + '='.repeat(60));
    console.log('✅ Manual run completed');
    console.log('='.repeat(60) + '\n');
  }

  async startScheduled() {
    console.log('\n' + '='.repeat(60));
    console.log('🤖 AUTOMATED MATCH FETCHER - SCHEDULER STARTED');
    console.log('='.repeat(60));
    console.log(`📅 Schedule: ${CONFIG.SCHEDULE} (cron format)`);
    console.log(`📍 Contract: ${CONFIG.CONTRACT_ADDRESS}`);
    console.log('='.repeat(60) + '\n');

    // Check connection first
    const connected = await this.checkConnection();
    if (!connected) {
      console.error('❌ Exiting due to connection failure');
      process.exit(1);
    }

    // Run once immediately on startup
    console.log('🚀 Running initial fetch...');
    await this.requestNewMatches();

    // Schedule daily runs
    cron.schedule(CONFIG.SCHEDULE, async () => {
      console.log('\n⏰ Scheduled run triggered');
      await this.requestNewMatches();
    });

    console.log('\n✅ Scheduler is now running');
    console.log('💡 The script will keep running and fetch matches according to schedule');
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

  const fetcher = new AutomatedMatchFetcher();

  switch (command) {
    case 'start':
    case 'schedule':
      await fetcher.startScheduled();
      break;
    
    case 'once':
    case 'now':
      await fetcher.runOnce();
      process.exit(0);
      break;
    
    default:
      console.log(`
Automated Match Fetcher

Usage:
  node automated-match-fetcher.js <command>

Commands:
  start, schedule    Start the scheduler (runs daily)
  once, now         Run once immediately then exit

Examples:
  node automated-match-fetcher.js start     # Start daily scheduler
  node automated-match-fetcher.js once      # Fetch matches now
      `);
      process.exit(0);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});