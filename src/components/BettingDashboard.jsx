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

  const contractAddress = '0xeCC7EFdaD35b246fF40d55FA68e68e829bE194Ac'; // Update with deployed contract address

const contractABI = contractAbi.abi;

  useEffect(() => {
    if (walletClient && isConnected) {
      const ethersSigner = new ethers.BrowserProvider(walletClient.transport).getSigner(walletClient.account.address);
      ethersSigner.then(async (signer) => {
        const bettingContract = new ethers.Contract(contractAddress, contractABI, signer);
        setContract(bettingContract);

        // Check if the connected user is the contract owner
        try {
          const owner = await bettingContract.owner();
          setIsOwner(owner.toLowerCase() === address.toLowerCase());
        } catch (error) {
          console.error('Error checking owner:', error);
          setIsOwner(false);
        }
      });
    } else {
      setContract(null);
      setMatches([]);
      setSelectedMatch(null);
      setIsOwner(false);
    }
  }, [walletClient, isConnected, address || '']);

  const fetchMatches = async () => {
    if (!contract) return;

    try {
      // Get the length of matchIds array
      const length = await contract.getMatchIdsLength();
      console.log('Match IDs length:', length);
      const matchList = [];
      for (let i = 0; i < length; i++) {
        const matchId = await contract.matchIds(i);
        console.log('Fetching match ID:', matchId);
        const match = await contract.matches(matchId);
        console.log('Match data:', match);
        matchList.push({
          id: match[0],
          homeTeam: match[1],
          awayTeam: match[2],
          matchDate: new Date(match[3] * 1000),
          result: match[4],
          homeOdds: match[5],
          drawOdds: match[6],
          awayOdds: match[7]
        });
      }
      setMatches(matchList);
      console.log('Fetched matches:', matchList.length);
    } catch (error) {
      console.error('Error fetching matches:', error);
      console.error('Error details:', error.message);
      if (error.data) {
        console.error('Error data:', error.data);
      }
    }
  };

  // Removed requestNewMatches function as matches are now automated

  useEffect(() => {
    if (contract) {
      fetchMatches();
      // Set up event listeners for real-time updates
      const handleMatchesFetched = (matchIds) => {
        console.log('New matches fetched:', matchIds);
        fetchMatches();
      };

      contract.on('MatchesFetched', handleMatchesFetched);

      // Auto-fetch matches on component mount
      const autoFetchMatches = async () => {
        try {
          await fetchMatches();
          console.log('Matches loaded automatically');
        } catch (error) {
          console.error('Error auto-fetching matches:', error);
        }
      };

      autoFetchMatches();

      return () => {
        if (contract) {
          contract.off('MatchesFetched', handleMatchesFetched);
        }
      };
    }
  }, [contract]);

  return (
    <div className="relative h-dvh w-screen overflow-x-hidden">
      {/* Back to Home button positioned at top left */}
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

      {/* Wallet button positioned at top right */}
      <div className="absolute top-4 right-4 z-50">
        <ConnectButton />
      </div>

      <div className="flex flex-col h-full">
        {/* Hero-like header section with video background */}
        <div
          id="video-frame"
          className="relative z-10 h-dvh w-screen overflow-hidden rounded-lg bg-blue-75"
        >
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
                    className="group relative z-10 w-fit cursor-pointer overflow-hidden rounded-full bg-violet-50
                    px-7 py-3 text-black transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-md
                    before:absolute before:inset-0 before:z-[-1] before:scale-0 before:rounded-full before:bg-[#edff66] before:transition-transform before:duration-300 before:origin-center hover:before:scale-100"
                  >
                    <span className="relative inline-flex overflow-hidden font-general text-xs uppercase">
                      Refresh Matches
                    </span>
                  </button>
                </div>
              )}
              {isOwner && (
  <button
    onClick={async () => {
      try {
        const tx = await contract.requestMatches();
        await tx.wait();
        alert("Requested new matches from Chainlink!");
      } catch (e) {
        console.error(e);
      }
    }}
    className="mt-4 bg-green-600 px-4 py-2 rounded"
  >
    Fetch Matches (Owner Only)
  </button>
)}

            </div>
          </div>
        </div>

        {/* Betting content section */}
        {isConnected && (
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
        )}

        {!isConnected && (
          <div className="flex-1 bg-black text-white flex items-center justify-center">
            <div className="text-center">
              <h2 className="special-font text-4xl font-black mb-4 text-white">Connect Your Wallet</h2>
              <p className="text-gray-400 font-general">Please connect your wallet using the button in the top right to start betting.</p>
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
