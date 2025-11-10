import React, { useEffect, useState } from 'react';

const MatchList = ({ matches, onSelectMatch, selectedId }) => {
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (matches.length > 0) {
      setLastUpdated(new Date());
    }
  }, [matches]);

  const formatFractional = (decimalOdds) => {
    if (!decimalOdds || decimalOdds <= 1) return '-';
    const fractional = (decimalOdds - 1).toFixed(2);
    const [num, denom] = fractional.split('.');
    return `${num}/${denom || 1}`;
  };

  const getStatusColor = (result) => {
    switch (result) {
      case 1:
        return 'text-green-400'; // Home Win
      case 2:
        return 'text-yellow-400'; // Draw
      case 3:
        return 'text-red-400'; // Away Win
      default:
        return 'text-blue-300'; // Scheduled
    }
  };

  const getStatusText = (result) => {
    switch (result) {
      case 1:
        return 'Home Win';
      case 2:
        return 'Draw';
      case 3:
        return 'Away Win';
      default:
        return 'Scheduled';
    }
  };

  return (
    <div className="match-list">
      <div className="flex items-center justify-between mb-4">
        <h2 className="special-font text-3xl font-black text-white">Available Matches</h2>
        {lastUpdated && (
          <p className="text-xs text-gray-400 font-general">
            Last Updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      {matches.length === 0 ? (
        <p className="text-gray-400 font-general">
          No matches available. Matches are loaded automatically. If none are available, they will be fetched soon.
        </p>
      ) : (
        <div className="space-y-5">
          {matches.map((match) => (
            <div
              key={match.id}
              onClick={() => onSelectMatch(match)}
              className={`bg-black/40 backdrop-blur-md border p-5 rounded-2xl cursor-pointer transition-all duration-300 ease-in-out hover:scale-[1.02] ${
                selectedId === match.id
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-white/10 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex justify-between items-center mb-3">
                <span className="font-robertmedium text-lg text-white tracking-wide">
                  {match.homeTeam} <span className="text-gray-400">vs</span> {match.awayTeam}
                </span>
                <span className="text-xs text-gray-400 font-general">
                  {match.matchDate.toLocaleDateString()} — {match.matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="flex justify-between font-general text-sm text-gray-300 mb-3">
                <span>
                  🏠 Home: <b className="text-white">{match.homeOdds.toFixed(2)}x</b> ({formatFractional(match.homeOdds)})
                </span>
                <span>
                  🤝 Draw: <b className="text-white">{match.drawOdds.toFixed(2)}x</b> ({formatFractional(match.drawOdds)})
                </span>
                <span>
                  🚀 Away: <b className="text-white">{match.awayOdds.toFixed(2)}x</b> ({formatFractional(match.awayOdds)})
                </span>
              </div>

              <div className={`text-sm font-general ${getStatusColor(match.result)}`}>
                Status: {getStatusText(match.result)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MatchList;