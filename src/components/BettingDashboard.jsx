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

  // Deployed contract details
  const contractAddress = '0x7EecC8E10B83222816499835820B7727fd6F046e';
  const contractABI = contractAbi.abi;

  // Initialize contract
  useEffect(() => {
    if (walletClient && isConnected) {
      const initContract = async () => {
        try {
          const provider = new ethers.BrowserProvider(walletClient.transport);
          const signer = await provider.getSigner();
          const bettingContract = new ethers.Contract(contractAddress, contractABI, signer);
          setContract(bettingContract);

          const owner = await bettingContract.owner();
          setIsOwner(owner.toLowerCase() === address.toLowerCase());
        } catch (error) {
          console.error('Error initializing contract:', error);
          setContract(null);
        }
      };
      initContract();
    } else {
      setContract(null);
      setMatches([]);
      setSelectedMatch(null);
      setIsOwner(false);
    }
  }, [walletClient, isConnected, address]);

  // Fetch matches from contract
  const fetchMatches = async () => {
    if (!contract) return;
    try {
      setIsLoadingMatches(true);
      const length = await contract.getMatchIdsLength();
      const matchList = [];

      for (let i = 0; i < length; i++) {
        const matchId = await contract.matchIds(i);
        const match = await contract.matches(matchId);

        matchList.push({
          id: match[0].toString(),
          homeTeam: match[1],
          awayTeam: match[2],
          matchDate: new Date(Number(match[3]) * 1000),
          result: match[4],
          homeOdds: Number(match[5]) / 100,
          drawOdds: Number(match[6]) / 100,
          awayOdds: Number(match[7]) / 100
        });
      }

      setMatches(matchList);
      console.log('✅ Matches fetched:', matchList);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setIsLoadingMatches(false);
    }
  };

  // Listen for contract events
  useEffect(() => {
    if (!contract) return;

    const handleMatchesFetched = (matchIds) => {
      console.log('🛰️ Matches fetched:', matchIds);
      fetchMatches();
    };

    const handleMatchResultFetched = (matchId, result) => {
      console.log('✅ Match result fetched:', { matchId, result });
      fetchMatches();
    };

    contract.on('MatchesFetched', handleMatchesFetched);
    contract.on('MatchResultFetched', handleMatchResultFetched);

    fetchMatches();

    return () => {
      contract.off('MatchesFetched', handleMatchesFetched);
      contract.off('MatchResultFetched', handleMatchResultFetched);
    };
  }, [contract]);

  const handleRequestMatches = async () => {
    if (!contract) return;
    try {
      setFetchingViaChainlink(true);
      const tx = await contract.requestMatches();
      await tx.wait();
      alert('✅ Requested new matches via Chainlink Functions!');
    } catch (e) {
      console.error('Error requesting matches:', e);
      alert('❌ Failed to request matches.');
    } finally {
      setFetchingViaChainlink(false);
    }
  };

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
        {/* Hero section */}
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
                <div className="mb-8 flex gap-4">
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
                      {fetchingViaChainlink ? 'Requesting...' : 'Fetch Matches (Owner Only)'}
                    </button>
                  )}
                </div>
              )}

              {fetchingViaChainlink && (
                <p className="text-yellow-400 text-sm font-general">
                  ⏳ Fetching matches via Chainlink Functions...
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Betting section */}
        {isConnected ? (
          <div className="flex-1 bg-black text-white p-8">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <MatchList matches={matches} onSelectMatch={setSelectedMatch} />
                </div>
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
              <h2 className="special-font text-4xl font-black mb-4 text-white">Connect Your Wallet</h2>
              <p className="text-gray-400 font-general">
                Please connect your wallet using the button in the top right to start betting.
              </p>
              <p className="text-yellow-400 font-general text-sm mt-4">
                Matches are loaded automatically. If none are available, they will be fetched soon.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BettingDashboard;
