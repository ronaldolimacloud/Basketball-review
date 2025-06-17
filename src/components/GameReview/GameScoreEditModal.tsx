import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw, Target } from 'lucide-react';

interface GameScoreEditModalProps {
  isOpen: boolean;
  teamName: string;
  opponentName: string;
  currentTeamScore: number;
  currentOpponentScore: number;
  onSave: (teamScore: number, opponentScore: number) => void;
  onCancel: () => void;
}

export const GameScoreEditModal: React.FC<GameScoreEditModalProps> = ({
  isOpen,
  teamName,
  opponentName,
  currentTeamScore,
  currentOpponentScore,
  onSave,
  onCancel,
}) => {
  const [teamScore, setTeamScore] = useState(currentTeamScore);
  const [opponentScore, setOpponentScore] = useState(currentOpponentScore);

  // Update local state when props change
  useEffect(() => {
    setTeamScore(currentTeamScore);
    setOpponentScore(currentOpponentScore);
  }, [currentTeamScore, currentOpponentScore, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(teamScore, opponentScore);
  };

  const handleReset = () => {
    setTeamScore(currentTeamScore);
    setOpponentScore(currentOpponentScore);
  };

  const adjustScore = (team: 'home' | 'away', amount: number) => {
    if (team === 'home') {
      setTeamScore(Math.max(0, teamScore + amount));
    } else {
      setOpponentScore(Math.max(0, opponentScore + amount));
    }
  };

  const hasChanges = teamScore !== currentTeamScore || opponentScore !== currentOpponentScore;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg p-6 max-w-md w-full mx-4 border border-zinc-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-yellow-400 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Edit Game Score
          </h3>
          <button
            onClick={onCancel}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Team Score Section */}
          <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-600">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-emerald-400 font-medium">{teamName}</h4>
              {teamScore !== currentTeamScore && (
                <span className="text-xs text-yellow-400">
                  (was {currentTeamScore})
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => adjustScore('home', -1)}
                className="p-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
                disabled={teamScore <= 0}
              >
                <span className="text-white font-bold">-1</span>
              </button>
              
              <input
                type="number"
                value={teamScore}
                onChange={(e) => setTeamScore(Math.max(0, parseInt(e.target.value) || 0))}
                className="flex-1 px-3 py-2 bg-zinc-700 border border-zinc-600 rounded text-center text-xl font-bold text-white focus:border-yellow-500 focus:outline-none"
                min="0"
              />
              
              <button
                onClick={() => adjustScore('home', 1)}
                className="p-2 bg-emerald-600 hover:bg-emerald-700 rounded transition-colors"
              >
                <span className="text-white font-bold">+1</span>
              </button>
            </div>

            <div className="flex gap-2 mt-2">
              <button
                onClick={() => adjustScore('home', 2)}
                className="flex-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 rounded text-xs transition-colors"
              >
                +2
              </button>
              <button
                onClick={() => adjustScore('home', 3)}
                className="flex-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 rounded text-xs transition-colors"
              >
                +3
              </button>
            </div>
          </div>

          {/* Opponent Score Section */}
          <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-600">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-red-400 font-medium">{opponentName}</h4>
              {opponentScore !== currentOpponentScore && (
                <span className="text-xs text-yellow-400">
                  (was {currentOpponentScore})
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => adjustScore('away', -1)}
                className="p-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
                disabled={opponentScore <= 0}
              >
                <span className="text-white font-bold">-1</span>
              </button>
              
              <input
                type="number"
                value={opponentScore}
                onChange={(e) => setOpponentScore(Math.max(0, parseInt(e.target.value) || 0))}
                className="flex-1 px-3 py-2 bg-zinc-700 border border-zinc-600 rounded text-center text-xl font-bold text-white focus:border-yellow-500 focus:outline-none"
                min="0"
              />
              
              <button
                onClick={() => adjustScore('away', 1)}
                className="p-2 bg-emerald-600 hover:bg-emerald-700 rounded transition-colors"
              >
                <span className="text-white font-bold">+1</span>
              </button>
            </div>

            <div className="flex gap-2 mt-2">
              <button
                onClick={() => adjustScore('away', 2)}
                className="flex-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 rounded text-xs transition-colors"
              >
                +2
              </button>
              <button
                onClick={() => adjustScore('away', 3)}
                className="flex-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 rounded text-xs transition-colors"
              >
                +3
              </button>
            </div>
          </div>

          {/* Score Summary */}
          <div className="bg-gradient-to-r from-zinc-800 to-zinc-700 rounded-lg p-4 border border-yellow-500/20">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400 mb-1">
                {teamScore} - {opponentScore}
              </div>
              <div className="text-sm text-zinc-400">
                {hasChanges ? 'Modified Score' : 'Current Score'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors text-zinc-300"
            disabled={!hasChanges}
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors text-zinc-300"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors text-white font-medium flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};