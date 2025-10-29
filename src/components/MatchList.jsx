import React from 'react';

const MatchList = ({ matches, onSelectMatch }) => {
  return (
    <div className="match-list">
      <h2 className="special-font text-3xl font-black mb-6 text-white">Available Matches</h2>
      {matches.length === 0 ? (
        <p className="text-gray-400 font-general">No matches available. Matches are loaded automatically. If none are available, they will be fetched soon.</p>
      ) : (
        <div className="space-y-6">
          {matches.map((match) => (
            <div
              key={match.id}
              className="bg-black/50 backdrop-blur-sm border border-white/20 p-6 rounded-lg cursor-pointer hover:bg-white/10 transition-all duration-300 hover:scale-105"
              onClick={() => onSelectMatch(match)}
            >
              <div className="flex justify-between items-center mb-4">
                <span className="font-robertmedium text-xl text-white">{match.homeTeam} vs {match.awayTeam}</span>
                <span className="text-sm text-gray-300 font-general">
                  {match.matchDate.toLocaleDateString()} {match.matchDate.toLocaleTimeString()}
                </span>
              </div>
              <div className="flex justify-between text-sm font-general text-gray-300 mb-3">
                <span>Home: {match.homeOdds / 100}x</span>
                <span>Draw: {match.drawOdds / 100}x</span>
                <span>Away: {match.awayOdds / 100}x</span>
              </div>
              <div className="text-sm font-general text-blue-300">
                Status: {match.result === 0 ? 'Scheduled' : match.result === 1 ? 'Home Win' : match.result === 2 ? 'Draw' : 'Away Win'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MatchList;
