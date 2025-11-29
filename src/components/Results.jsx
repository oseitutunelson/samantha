import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import betTicketNFTAbi from './contracts/BetTicketNFT.json'; // ← Make sure you have the correct ABI

const Results = ({ contract, account, refreshTrigger }) => {
  const [bets, setBets] = useState([]);
  const [claimingBet, setClaimingBet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contract || !account) return;

    const fetchUserBets = async () => {
      setLoading(true);
      try {
        console.log('🔍 Fetching user bets for:', account);

        // Get the BetTicketNFT contract address
        const betTicketNFTAddress = await contract.betTicketNFT();
        console.log('📍 BetTicketNFT address:', betTicketNFTAddress);

        // Create BetTicketNFT contract instance
        const betTicketNFTAbiArray = [
          "function getNextTokenId() view returns (uint256)",
          "function totalSupply() view returns (uint256)", // Alternative
          "function ownerOf(uint256 tokenId) view returns (address)",
          "function betDetails(uint256 tokenId) view returns (uint256 matchId, uint8 prediction, uint256 amount, bool resolved, bool won)"
        ];
        
        const betTicketNFT = new ethers.Contract(
          betTicketNFTAddress, 
          betTicketNFTAbiArray, 
          contract.runner
        );

        // Get the next token ID to know how many tokens exist
        let nextTokenId;
        try {
          nextTokenId = await betTicketNFT.getNextTokenId();
          console.log('📊 Next token ID:', nextTokenId.toString());
        } catch (error) {
          console.warn('⚠️ getNextTokenId() not found, trying totalSupply()...');
          try {
            nextTokenId = await betTicketNFT.totalSupply();
            console.log('📊 Total supply:', nextTokenId.toString());
          } catch (e) {
            console.error('❌ Could not get token count');
            console.error('💡 Make sure your BetTicketNFT contract has getNextTokenId() or totalSupply()');
            setLoading(false);
            return;
          }
        }

        const userBets = [];

        // Loop through all possible token IDs and check ownership
        for (let tokenId = 0; tokenId < Number(nextTokenId); tokenId++) {
          try {
            const owner = await betTicketNFT.ownerOf(tokenId);
            
            if (owner.toLowerCase() === account.toLowerCase()) {
              const details = await betTicketNFT.betDetails(tokenId);
              
              userBets.push({
                tokenId: tokenId,
                matchId: details.matchId.toString(),
                prediction: Number(details.prediction),
                amount: ethers.formatUnits(details.amount, 6), // USDT has 6 decimals
                resolved: details.resolved,
                won: details.won,
                claimed: false
              });
              
              console.log(`✅ Found bet #${tokenId} for user`);
            }
          } catch (error) {
            // Token doesn't exist or other error, skip
            if (!error.message.includes('ERC721NonexistentToken')) {
              console.log(`⚠️ Skipping token ${tokenId}:`, error.message);
            }
          }
        }

        console.log(`🎯 Found ${userBets.length} bets for user`);
        setBets(userBets);
      } catch (error) {
        console.error('❌ Error fetching user bets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserBets();
  }, [contract, account, refreshTrigger]);

  const claimReward = async (tokenId) => {
    if (!contract) return;

    setClaimingBet(tokenId);
    try {
      console.log(`💰 Claiming reward for bet #${tokenId}...`);
      
      const tx = await contract.claimReward(tokenId);
      console.log('⏳ Transaction sent:', tx.hash);
      
      await tx.wait();
      console.log('✅ Transaction confirmed');
      
      alert('✅ Reward claimed successfully!');
      
      // Update the bet status
      setBets(bets.map(bet =>
        bet.tokenId === tokenId ? { ...bet, claimed: true } : bet
      ));
    } catch (error) {
      console.error('❌ Error claiming reward:', error);
      
      if (error.message.includes('user rejected')) {
        alert('Transaction cancelled');
      } else if (error.message.includes('Bet not resolved')) {
        alert('This bet has not been resolved yet');
      } else if (error.message.includes('Bet not won')) {
        alert('This bet was not won');
      } else {
        alert('Failed to claim reward. Check console for details.');
      }
    } finally {
      setClaimingBet(null);
    }
  };

  const getPredictionText = (prediction) => {
    switch (prediction) {
      case 0: return 'Home Win';
      case 1: return 'Draw';
      case 2: return 'Away Win';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="results mt-8">
        <h3 className="special-font text-2xl font-black mb-6 text-white">Your Bets</h3>
        <p className="text-gray-400 font-general">Loading your bets...</p>
      </div>
    );
  }

  return (
    <div className="results mt-8">
      <h3 className="special-font text-2xl font-black mb-6 text-white">Your Bets</h3>
      {bets.length === 0 ? (
        <p className="text-gray-400 font-general">No bets placed yet.</p>
      ) : (
        <div className="space-y-6">
          {bets.map((bet) => (
            <div 
              key={bet.tokenId} 
              className="bg-black/50 backdrop-blur-sm border border-white/20 p-6 rounded-lg hover:border-white/40 transition-all"
            >
              <div className="flex justify-between items-center mb-4">
                <span className="font-robertmedium text-lg text-white">
                  Bet #{bet.tokenId}
                </span>
                <span className={`text-sm px-3 py-1 rounded font-general ${
                  bet.resolved 
                    ? (bet.won ? 'bg-green-600 text-white' : 'bg-red-600 text-white') 
                    : 'bg-yellow-600 text-black'
                }`}>
                  {bet.resolved ? (bet.won ? '✅ Won' : '❌ Lost') : '⏳ Pending'}
                </span>
              </div>
              
              <div className="space-y-2">
                <p className="text-gray-300 font-general">
                  <span className="text-gray-500">Match ID:</span> {bet.matchId}
                </p>
                <p className="text-gray-300 font-general">
                  <span className="text-gray-500">Prediction:</span> {getPredictionText(bet.prediction)}
                </p>
                <p className="text-gray-300 font-general">
                  <span className="text-gray-500">Amount:</span> {bet.amount} USDT
                </p>
              </div>

              {bet.resolved && bet.won && !bet.claimed && (
                <button
                  onClick={() => claimReward(bet.tokenId)}
                  disabled={claimingBet === bet.tokenId}
                  className="mt-4 group relative z-10 w-fit cursor-pointer overflow-hidden rounded-full bg-violet-50
                  px-6 py-2 text-black transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-md
                  before:absolute before:inset-0 before:z-[-1] before:scale-0 before:rounded-full before:bg-[#edff66] 
                  before:transition-transform before:duration-300 before:origin-center hover:before:scale-100 
                  disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative inline-flex overflow-hidden font-general text-xs uppercase">
                    {claimingBet === bet.tokenId ? '⏳ Claiming...' : '💰 Claim Reward'}
                  </span>
                </button>
              )}

              {bet.claimed && (
                <div className="mt-4 text-green-500 font-general text-sm">
                  ✅ Reward claimed!
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Results;