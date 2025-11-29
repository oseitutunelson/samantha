import React, { useState } from 'react';
import { ethers } from 'ethers';

const BetForm = ({ match, contract, account, onBetPlaced }) => {
  const [prediction, setPrediction] = useState(0);
  const [amount, setAmount] = useState('');
  const [isPlacingBet, setIsPlacingBet] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contract || !match || !amount) return;

    setIsPlacingBet(true);
    try {
      const amountInWei = ethers.parseUnits(amount, 6); // Assuming USDT has 6 decimals

      // First, approve the contract to spend USDT
      const usdtAddress = '0x6caea8E4D5Fbfa00b0a2e9645a86e489926fe6c6'; // USDT contract address from deployment
      const usdtABI = ['function approve(address spender, uint256 amount) public returns (bool)'];
      const usdtContract = new ethers.Contract(usdtAddress, usdtABI, contract.runner);

      const approveTx = await usdtContract.approve(await contract.getAddress(), amountInWei);
      await approveTx.wait();

      // Then place the bet
      const tx = await contract.placeBet(match.id, prediction, amountInWei);
      await tx.wait();

      alert('Bet placed successfully!');
      setAmount('');
      onBetPlaced();
    } catch (error) {
      console.error('Error placing bet:', error);
      alert('Failed to place bet. Check console for details.');
    } finally {
      setIsPlacingBet(false);
    }
  };

  if (match.result !== 0) {
    return (
      <div className="bet-form bg-black/50 backdrop-blur-sm border border-white/20 p-6 rounded-lg">
        <h3 className="special-font text-2xl font-black mb-4 text-white">Match Result</h3>
        <p className="text-gray-300 font-general mb-2">This match has already been resolved.</p>
        <p className="text-blue-300 font-general">Result: {match.result === 1 ? 'Home Win' : match.result === 2 ? 'Draw' : 'Away Win'}</p>
      </div>
    );
  }

  return (
    <div className="bet-form bg-black/50 backdrop-blur-sm border border-white/20 p-6 rounded-lg">
      <h3 className="special-font text-2xl font-black mb-6 text-white">Place Bet on {match.homeTeam} vs {match.awayTeam}</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-sm font-robertmedium mb-3 text-white">Prediction</label>
          <select
            value={prediction}
            onChange={(e) => setPrediction(parseInt(e.target.value))}
            className="w-full p-3 bg-black/50 border border-white/20 rounded-lg text-white font-general focus:border-blue-300 focus:outline-none"
          >
            <option value={0}>Home Win ({match.homeOdds / 100}x)</option>
            <option value={1}>Draw ({match.drawOdds / 100}x)</option>
            <option value={2}>Away Win ({match.awayOdds / 100}x)</option>
          </select>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-robertmedium mb-3 text-white">Bet Amount (USDT)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full p-3 bg-black/50 border border-white/20 rounded-lg text-white font-general placeholder-gray-400 focus:border-blue-300 focus:outline-none"
            step="0.01"
            min="0"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isPlacingBet}
          className="w-full group relative z-10 cursor-pointer overflow-hidden rounded-full bg-violet-50
          px-7 py-3 text-black transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-md
          before:absolute before:inset-0 before:z-[-1] before:scale-0 before:rounded-full before:bg-[#edff66] before:transition-transform before:duration-300 before:origin-center hover:before:scale-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="relative inline-flex overflow-hidden font-general text-xs uppercase">
            {isPlacingBet ? 'Placing Bet...' : 'Place Bet'}
          </span>
        </button>
      </form>
    </div>
  );
};

export default BetForm;
