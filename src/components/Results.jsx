import React, { useState, useEffect } from 'react';

const Results = ({ contract, account }) => {
  const [bets, setBets] = useState([]);
  const [claimingBet, setClaimingBet] = useState(null);

  // This is a simplified version. In a real app, you'd need to track user's NFT tokens
  // For now, we'll assume the user has some bet tokens and display them

  const mockBets = [
    { tokenId: 1, matchId: 123, prediction: 0, amount: 100, resolved: true, won: true },
    { tokenId: 2, matchId: 124, prediction: 1, amount: 50, resolved: false, won: false },
  ];

  useEffect(() => {
    // In a real implementation, you'd fetch the user's bet tokens from the NFT contract
    setBets(mockBets);
  }, [account]);

  const claimReward = async (tokenId) => {
    if (!contract) return;

    setClaimingBet(tokenId);
    try {
      const tx = await contract.claimReward(tokenId);
      await tx.wait();
      alert('Reward claimed successfully!');
      // Update the bet status
      setBets(bets.map(bet =>
        bet.tokenId === tokenId ? { ...bet, claimed: true } : bet
      ));
    } catch (error) {
      console.error('Error claiming reward:', error);
      alert('Failed to claim reward. Check console for details.');
    } finally {
      setClaimingBet(null);
    }
  };

  return (
    <div className="results mt-8">
      <h3 className="special-font text-2xl font-black mb-6 text-white">Your Bets</h3>
      {bets.length === 0 ? (
        <p className="text-gray-400 font-general">No bets placed yet.</p>
      ) : (
        <div className="space-y-6">
          {bets.map((bet) => (
            <div key={bet.tokenId} className="bg-black/50 backdrop-blur-sm border border-white/20 p-6 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <span className="font-robertmedium text-lg text-white">Bet #{bet.tokenId}</span>
                <span className={`text-sm px-3 py-1 rounded font-general ${
                  bet.resolved ? (bet.won ? 'bg-green-600' : 'bg-red-600') : 'bg-yellow-600'
                }`}>
                  {bet.resolved ? (bet.won ? 'Won' : 'Lost') : 'Pending'}
                </span>
              </div>
              <p className="text-gray-300 font-general mb-2">Match ID: {bet.matchId}</p>
              <p className="text-gray-300 font-general mb-2">Prediction: {bet.prediction === 0 ? 'Home Win' : bet.prediction === 1 ? 'Draw' : 'Away Win'}</p>
              <p className="text-gray-300 font-general mb-4">Amount: {bet.amount} USDT</p>
              {bet.resolved && bet.won && !bet.claimed && (
                <button
                  onClick={() => claimReward(bet.tokenId)}
                  disabled={claimingBet === bet.tokenId}
                  className="group relative z-10 w-fit cursor-pointer overflow-hidden rounded-full bg-violet-50
                  px-6 py-2 text-black transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-md
                  before:absolute before:inset-0 before:z-[-1] before:scale-0 before:rounded-full before:bg-[#edff66] before:transition-transform before:duration-300 before:origin-center hover:before:scale-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative inline-flex overflow-hidden font-general text-xs uppercase">
                    {claimingBet === bet.tokenId ? 'Claiming...' : 'Claim Reward'}
                  </span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Results;
