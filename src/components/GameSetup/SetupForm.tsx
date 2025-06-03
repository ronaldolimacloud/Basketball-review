import React, { useState } from 'react';
import type { GameFormat } from '../../types/game.types';

interface SetupFormProps {
  onSetupComplete: (teamName: string, opponentName: string, gameFormat: GameFormat) => void;
}

export const SetupForm: React.FC<SetupFormProps> = ({ onSetupComplete }) => {
  const [teamName, setTeamName] = useState('');
  const [opponentName, setOpponentName] = useState('');
  const [gameFormat, setGameFormat] = useState<GameFormat>('quarters');

  const handleSubmit = () => {
    if (teamName.trim() && opponentName.trim()) {
      onSetupComplete(teamName.trim(), opponentName.trim(), gameFormat);
    }
  };

  const isValid = teamName.trim() && opponentName.trim();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-lg p-8 max-w-2xl w-full border border-slate-700">
        <h1 className="text-3xl font-bold mb-8 text-center text-yellow-400">
          Basketball Game Setup
        </h1>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300">
              Your Team Name
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="Enter your team name"
              maxLength={30}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300">
              Opponent Team Name
            </label>
            <input
              type="text"
              value={opponentName}
              onChange={(e) => setOpponentName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="Enter opponent team name"
              maxLength={30}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300">
              Game Format
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setGameFormat('quarters')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  gameFormat === 'quarters'
                    ? 'border-yellow-500 bg-yellow-500 bg-opacity-20'
                    : 'border-slate-600 hover:border-slate-500 bg-slate-800'
                }`}
              >
                <div className="font-semibold text-white">4 Quarters</div>
                <div className="text-sm text-slate-400">NBA, High School</div>
              </button>
              <button
                onClick={() => setGameFormat('halves')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  gameFormat === 'halves'
                    ? 'border-yellow-500 bg-yellow-500 bg-opacity-20'
                    : 'border-slate-600 hover:border-slate-500 bg-slate-800'
                }`}
              >
                <div className="font-semibold text-white">2 Halves</div>
                <div className="text-sm text-slate-400">College Basketball</div>
              </button>
            </div>
          </div>
          
          <div className="mt-8">
            <button
              onClick={handleSubmit}
              className={`w-full py-3 rounded-lg font-semibold text-lg transition-colors ${
                isValid
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
              disabled={!isValid}
            >
              Start Game Review
            </button>
          </div>
          
          <p className="text-sm text-slate-400 text-center mt-4">
            You can edit player names during the game by clicking the edit icon next to their name
          </p>
        </div>
      </div>
    </div>
  );
}; 