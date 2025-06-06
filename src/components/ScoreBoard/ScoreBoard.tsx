import React from 'react';
import { Timer } from 'lucide-react';

interface ScoreBoardProps {
  teamName: string;
  opponentName: string;
  teamScore: number;
  opponentScore: number;
  teamFouls: number;
  teamTimeouts: number;
  opponentTimeouts: number;
  onOpponentScore: (points: number) => void;
  onTeamTimeout: () => void;
  onOpponentTimeout: () => void;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  teamName,
  opponentName,
  teamScore,
  opponentScore,
  teamFouls,
  teamTimeouts,
  onOpponentScore,
  onTeamTimeout,
  onOpponentTimeout,
}) => {
  return (
    <div className="bg-zinc-800 rounded-lg p-4 mb-4 border border-zinc-600">
      <div className="text-center text-3xl font-bold mb-2">
        <span className="text-white">{teamName}: {teamScore}</span>
        <span className="mx-3 text-zinc-400">-</span>
        <span className="text-white">{opponentName}: {opponentScore}</span>
      </div>
      
      <div className="flex justify-center items-center gap-4 mb-2">
        <div className="text-sm">
          <span className="text-zinc-400">Team Fouls:</span>
          <span className="ml-2 font-semibold text-amber-400">{teamFouls}</span>
        </div>
        <div className="text-sm">
          <span className="text-zinc-400">Timeouts:</span>
          <span className="ml-2 font-semibold text-yellow-400">{teamTimeouts}</span>
        </div>
      </div>
      
      <div className="flex justify-center gap-2 mb-4">
        <button
          onClick={() => onOpponentScore(1)}
          className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 px-6 py-3 rounded-lg inline-block text-black font-bold transition-all transform hover:scale-105 shadow-lg"
        >
          {opponentName} +1
        </button>
        <button
          onClick={() => onOpponentScore(2)}
          className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 px-6 py-3 rounded-lg inline-block text-black font-bold transition-all transform hover:scale-105 shadow-lg"
        >
          {opponentName} +2
        </button>
        <button
          onClick={() => onOpponentScore(3)}
          className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 px-6 py-3 rounded-lg inline-block text-black font-bold transition-all transform hover:scale-105 shadow-lg"
        >
          {opponentName} +3
        </button>
      </div>

      {/* Timeout buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onTeamTimeout}
          className="bg-zinc-700 hover:bg-zinc-600 p-2 rounded text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <Timer className="w-4 h-4" />
          {teamName} Timeout
        </button>
        <button
          onClick={onOpponentTimeout}
          className="bg-zinc-700 hover:bg-zinc-600 p-2 rounded text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <Timer className="w-4 h-4" />
          {opponentName} Timeout
        </button>
      </div>
    </div>
  );
}; 