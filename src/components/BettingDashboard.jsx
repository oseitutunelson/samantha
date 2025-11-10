import React, { useState, useEffect } from 'react';
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
  const [hasAutoRequested, setHasAutoRequested] = useState(false); // Prevent spam

  // ──────────────────────────────────────────────────────────────
  // Contract address & ABI
  // ──────────────────────────────────────────────────────────────
  const contractAddress = '0xB8530571346B601f2f291B1298C3F46D7F7c480C';
  const contractABI = contractAbi.abi;

  // ──────────────────────────────────────────────────────────────
  // Initialise ethers contract
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (walletClient && isConnected) {
      const init = async () => {
        try {
          const provider = new ethers.BrowserProvider(walletClient.transport);
          const signer = await provider.getSigner();
          const bettingContract = new ethers.Contract(contractAddress, contractABI, signer);
          setContract(bettingContract);

          const owner = await bettingContract.owner();
          setIsOwner(owner.toLowerCase() === address?.toLowerCase());
          console.log('Contract initialized');
        } catch (e) {
          console.error('Contract init error:', e);
        }
      };
      init();
    } else {
      setContract(null);
      setMatches([]);
      setSelectedMatch(null);
      setIsOwner(false);
      setHasAutoRequested(false);
    }
  }, [walletClient, isConnected, address]);

  // ──────────────────────────────────────────────────────────────
  // Fetch all matches from the contract
  // ──────────────────────────────────────────────────────────────
  const fetchMatches = async () => {
    if (!contract) return;
    try {
      setIsLoadingMatches(true);
      console.log('Fetching matches...');

      const length = await contract.getMatchIdsLength();
      console.log(`getMatchIdsLength() = ${length}`);

      if (length === 0n) {
        console.log('No matches yet.');
        setMatches([]);
        return;
      }

      const list = [];
      for (let i = 0; i < Number(length); i++) {
        try {
          const id = await contract.matchIds(i);
          const m = await contract.matches(id);
          list.push({
            id: m.id.toString(),
            homeTeam: m.homeTeam,
            awayTeam: m.awayTeam,
            matchDate: new Date(Number(m.matchDate) * 1000),
            result: Number(m.result),
            homeOdds: Number(m.homeOdds) / 100,
            drawOdds: Number(m.drawOdds) / 100,
            awayOdds: Number(m.awayOdds) / 100,
          });
        } catch (err) {
          console.error(`Error reading match at index ${i}:`, err);
        }
      }

      console.log('Matches loaded:', list);
      setMatches(list);
    } catch (e) {
      console.error('fetchMatches failed:', e);
    } finally {
      setIsLoadingMatches(false);
    }
  };

  // ──────────────────────────────────────────────────────────────
  // AUTO-LOAD: Poll every 15s + Auto-request once if owner
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!contract) return;

    // Poll every 15 seconds
    const pollInterval = setInterval(fetchMatches, 15_000);

    // On first load: if no matches & owner → request once
    const initCheck = async () => {
      await fetchMatches();
      if (matches.length === 0 && isOwner && !hasAutoRequested) {
        console.log('No matches – auto-requesting as owner...');
        try {
          const tx = await contract.requestMatches();
          await tx.wait();
          setHasAutoRequested(true);
          alert('Matches requested! They’ll appear in ~30 seconds.');
        } catch (e) {
          console.error('Auto-request failed:', e);
        }
      }
    };
    initCheck();

    return () => clearInterval(pollInterval);
  }, [contract, isOwner, matches.length, hasAutoRequested]);

  // ──────────────────────────────────────────────────────────────
  // Event listeners – instant update
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!contract) return;

    const onMatchesFetched = () => {
      console.log('MatchesFetched event → refreshing');
      fetchMatches();
    };

    contract.on('MatchesFetched', onMatchesFetched);
    return () => contract.off('MatchesFetched', onMatchesFetched);
  }, [contract]);

  // ──────────────────────────────────────────────────────────────
  // Owner: Manual request
  // ──────────────────────────────────────────────────────────────
  const handleRequestMatches = async () => {
    if (!contract) return;
    try {
      setFetchingViaChainlink(true);
      const tx = await contract.requestMatches();
      await tx.wait();
      alert('New matches requested – refreshing in 30s');
      setTimeout(fetchMatches, 30_000);
    } catch (e) {
      console.error(e);
      alert('Request failed: ' + (e?.reason || e?.message));
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

      <div className="flex flex-col h-full">
        {/* Hero */}
        <div className="relative z-10 h-dvh w-screen overflow-hidden rounded-lg bg-blue-75">
          <div className="absolute left-0 top-0 z-40 size-full">
            <div className="mt-24 px-5 sm:px-10">
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
                               before:absolute before:inset-0 before:z-[-1] before:scale-0 before:rounded-full before:bg-[#edff66] before:transition-transform before:duration-300 before:origin-center hover:before:scale-100"
                  >
                    <span className="relative inline-flex overflow-hidden font-general text-xs uppercase">
                      {isLoadingMatches ? 'Loading...' : 'Refresh Matches'}
                    </span>
                  </button>

                  {isOwner && (
                    <button
                      onClick={handleRequestMatches}
                      disabled={fetchingViaChainlink}
                      className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white transition-all"
                    >
                      {fetchingViaChainlink ? 'Requesting...' : 'Fetch Matches (Owner)'}
                    </button>
                  )}
                </div>
              )}

              {fetchingViaChainlink && (
                <p className="text-yellow-400 text-sm font-general">
                  Fetching matches via Chainlink… (Wait ~30s then refresh)
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
                {/* Left – match list */}
                <div>
                  {matches.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      <p>No matches yet. {isOwner ? 'Requesting...' : 'Waiting for owner...'}</p>
                    </div>
                  ) : (
                    <MatchList
                      matches={matches}
                      onSelectMatch={setSelectedMatch}
                      selectedId={selectedMatch?.id}
                    />
                  )}
                </div>

                {/* Right – bet form + results */}
                <div>
                  {selectedMatch && (
                    <BetForm
                      match={selectedMatch}
                      contract={contract}
                      account={address}
                      onBetPlaced={fetchMatches}
                    />
                  )}
                  <Results contract={contract} account={address} />
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
              <p className="text-yellow-400 font-general text-sm mt-4">
                Matches load automatically. If none show, the owner will fetch them soon.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BettingDashboard;