import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useWalletClient } from 'wagmi';
import MatchList from './MatchList';
import BetForm from './BetForm';
import Results from './Results';
import contractAbi from './contracts/BettingContract.json';

const BettingDashboard = ({ onBackToHome }) => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [contract, setContract] = useState(null);
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [fetchingViaChainlink, setFetchingViaChainlink] = useState(false);
  const [betsRefreshTrigger, setBetsRefreshTrigger] = useState(0);

  const hasRequestedRef = useRef(false);

  const contractAddress = '0x513EC06a093b9c027e07Ed00427A5269d1E0F4B9';
  const contractABI = contractAbi.abi;

  // ──────────────────────────────────────────────────────────────
  // Initialise ethers contract
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (walletClient && isConnected) {
      const init = async () => {
        try {
          const network = new ethers.Network("matic-amoy", 80002);
          const provider = new ethers.BrowserProvider(walletClient.transport, network);
          const signer = await provider.getSigner();
          const bettingContract = new ethers.Contract(contractAddress, contractABI, signer);
          setContract(bettingContract);

          const owner = await bettingContract.owner();
          setIsOwner(owner.toLowerCase() === address?.toLowerCase());
          console.log('✅ Contract initialized');
          console.log('   Address:', contractAddress);
          console.log('   Owner:', owner);
          console.log('   Is Owner:', owner.toLowerCase() === address?.toLowerCase());
        } catch (e) {
          console.error('❌ Contract init error:', e);
        }
      };
      init();
    } else {
      setContract(null);
      setMatches([]);
      setSelectedMatch(null);
      setIsOwner(false);
      hasRequestedRef.current = false;
    }
  }, [walletClient, isConnected, address]);

  // ──────────────────────────────────────────────────────────────
  // Fetch matches with proper error handling
  // ──────────────────────────────────────────────────────────────
  const fetchMatches = useCallback(async () => {
    if (!contract) {
      console.log('⚠️ No contract yet');
      return;
    }
    
    try {
      setIsLoadingMatches(true);
      console.log('📥 Fetching matches...');

      const length = await contract.getMatchIdsLength();
      console.log(`📊 Match count: ${length.toString()}`);

      if (length === 0n) {
        console.log('⚠️ No matches stored in contract');
        setMatches([]);
        return;
      }

      const list = [];
      for (let i = 0; i < Number(length); i++) {
        try {
          const id = await contract.matchIds(i);
          console.log(`  Reading match ${i + 1}, ID: ${id.toString()}`);
          
          const m = await contract.matches(id);
          
          const matchObj = {
            id: m.id.toString(),
            homeTeam: m.homeTeam,
            awayTeam: m.awayTeam,
            matchDate: new Date(Number(m.matchDate) * 1000),
            result: Number(m.result),
            homeOdds: Number(m.homeOdds) / 100,
            drawOdds: Number(m.drawOdds) / 100,
            awayOdds: Number(m.awayOdds) / 100,
          };
          
          console.log(`  ✅ ${matchObj.homeTeam} vs ${matchObj.awayTeam}`);
          list.push(matchObj);
        } catch (err) {
          console.error(`  ❌ Error reading match ${i}:`, err);
        }
      }

      console.log(`✅ Loaded ${list.length} matches`);
      setMatches(list);
    } catch (e) {
      console.error('❌ fetchMatches failed:', e);
    } finally {
      setIsLoadingMatches(false);
    }
  }, [contract]);

  // ──────────────────────────────────────────────────────────────
  // Initial load + event listeners (no dependencies on matches!)
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!contract) return;

    console.log('🔧 Setting up...');

    // Initial fetch
    fetchMatches();

    // Event listeners
    const onMatchesFetched = (matchIds) => {
      console.log('🎉 MatchesFetched event!', matchIds);
      fetchMatches();
    };

    const onParsingError = (reason, data) => {
      console.error('❌ ParsingError event:', reason, data);
    };

    try {
      contract.on('MatchesFetched', onMatchesFetched);
      contract.on('ParsingError', onParsingError);
      console.log('✅ Event listeners attached');
    } catch (error) {
      console.error('⚠️ Event setup failed:', error);
    }

    return () => {
      try {
        contract.off('MatchesFetched', onMatchesFetched);
        contract.off('ParsingError', onParsingError);
        console.log('🧹 Cleaned up event listeners');
      } catch (error) {
        console.error('⚠️ Cleanup failed:', error);
      }
    };
  }, [contract, fetchMatches]);

  // ──────────────────────────────────────────────────────────────
  // Auto-request matches ONCE if owner and no matches
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!contract || !isOwner || hasRequestedRef.current) return;

    const checkAndRequest = async () => {
      try {
        const length = await contract.getMatchIdsLength();
        
        if (length === 0n) {
          console.log('🤖 Auto-requesting matches (owner)...');
          hasRequestedRef.current = true;
          
          const tx = await contract.requestMatches();
          console.log('⏳ Request transaction:', tx.hash);
          await tx.wait();
          console.log('✅ Request confirmed');
          
          // Auto-refresh after 40 seconds
          setTimeout(() => {
            console.log('🔄 Auto-refreshing...');
            fetchMatches();
          }, 40000);
        }
      } catch (e) {
        console.error('❌ Auto-request failed:', e);
        hasRequestedRef.current = false; // Allow retry
      }
    };

    // Small delay to let initial fetch complete
    const timer = setTimeout(checkAndRequest, 2000);
    return () => clearTimeout(timer);
  }, [contract, isOwner, fetchMatches]);

  // ──────────────────────────────────────────────────────────────
  // Manual request
  // ──────────────────────────────────────────────────────────────
  const handleRequestMatches = async () => {
    if (!contract) return;
    try {
      setFetchingViaChainlink(true);
      console.log('📡 Manual request started...');
      
      const tx = await contract.requestMatches();
      console.log('⏳ Transaction:', tx.hash);
      
      await tx.wait();
      console.log('✅ Transaction confirmed');
      
      alert('✅ Matches requested! Wait 30-40 seconds then click Refresh.');
      
      setTimeout(() => {
        fetchMatches();
      }, 35000);
    } catch (e) {
      console.error('❌ Request failed:', e);
      alert('Request failed: ' + (e?.reason || e?.message || 'Unknown error'));
    } finally {
      setFetchingViaChainlink(false);
    }
  };

  // ──────────────────────────────────────────────────────────────
  // UI
  // ──────────────────────────────────────────────────────────────
  return (
    <div className="relative h-dvh w-screen overflow-x-hidden">
      {/* Back button */}
      <div className="absolute top-4 left-4 z-50">
        <button
          onClick={onBackToHome}
          className="group relative z-10 w-fit cursor-pointer overflow-hidden rounded-full bg-transparent border border-white/20
                     px-6 py-2 text-white transition-all duration-300 ease-in-out hover:bg-white/10 hover:border-white/40
                     backdrop-blur-sm"
        >
          <span className="relative inline-flex overflow-hidden font-general text-xs uppercase">
            Back to Home
          </span>
        </button>
      </div>

      {/* Wallet connect */}
      <div className="absolute top-4 right-4 z-50">
        <ConnectButton />
      </div>

      <div className="flex flex-col h-full py-0">
        {/* Hero */}
        <div className="relative z-10 h-dvh w-screen overflow-hidden rounded-lg bg-blue-75">
          <div className="absolute left-0 top-4 z-40 size-full">
            <div className="mt-24 px-5 sm:px-10 ">
              <h1 className="hero-heading header-font text-blue-100">
                S<b>a</b>mantha
              </h1>
              <p className="mb-5 max-w-64 font-VeniteAdoremus-straight text-blue-100">
                Place Your Bets on EPL Matches
              </p>

              {isConnected && (
                <div className="mb-8 flex gap-4 flex-wrap">
                  <button
                    onClick={fetchMatches}
                    disabled={isLoadingMatches}
                    className="group relative z-10 w-fit cursor-pointer overflow-hidden rounded-full bg-violet-50
                               px-7 py-3 text-black transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-md
                               before:absolute before:inset-0 before:z-[-1] before:scale-0 before:rounded-full before:bg-[#edff66] before:transition-transform before:duration-300 before:origin-center hover:before:scale-100 disabled:opacity-50"
                  >
                    <span className="relative inline-flex overflow-hidden font-general text-xs uppercase">
                      {isLoadingMatches ? 'Loading...' : 'Refresh Matches'}
                    </span>
                  </button>

                  {/* {isOwner && (
                    <button
                      onClick={handleRequestMatches}
                      disabled={fetchingViaChainlink}
                      className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white transition-all disabled:opacity-50"
                    >
                      {fetchingViaChainlink ? 'Requesting...' : 'Fetch New Matches'}
                    </button>
                  )} */}
                </div>
              )}

              {fetchingViaChainlink && (
                <p className="text-yellow-400 text-sm font-general mb-2">
                  📡 Requesting via Chainlink... Wait 30-40 seconds.
                </p>
              )}
              
              {isConnected && (
                <p className="text-xs text-gray-400 font-general">
                  💡 {matches.length} matches loaded | {isOwner ? 'You are owner' : 'Not owner'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Main betting area */}
        {isConnected ? (
          <div className="flex-1 bg-black text-white p-8">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <MatchList
                    matches={matches}
                    onSelectMatch={setSelectedMatch}
                    selectedId={selectedMatch?.id}
                  />
                </div>

                <div>
                  {selectedMatch && (
                    <BetForm
                      match={selectedMatch}
                      contract={contract}
                      account={address}
                      onBetPlaced={() => {
                        fetchMatches();
                        setBetsRefreshTrigger(prev => prev + 1);
                      }}
                    />
                  )}
                  <Results contract={contract} account={address} refreshTrigger={betsRefreshTrigger} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-black text-white flex items-center justify-center">
            <div className="text-center">
              <h2 className="special-font text-4xl font-black mb-4 text-white">
                Connect Your Wallet
              </h2>
              <p className="text-gray-400 font-general">
                Use the button in the top-right to connect and start betting.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BettingDashboard;