import React from 'react';
import { X } from 'lucide-react';
import type { Player } from '../../types/game.types';
import { formatTime } from '../../utils/timeFormatters';

interface SubstitutionModalProps {
  isOpen: boolean;
  playerComingIn: Player | null;
  playersOnCourt: Player[];
  onSubstitute: (playerOutId: number) => void;
  onCancel: () => void;
}

export const SubstitutionModal: React.FC<SubstitutionModalProps> = ({
  isOpen,
  playerComingIn,
  playersOnCourt,
  onSubstitute,
  onCancel,
}) => {
  if (!isOpen || !playerComingIn) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg p-6 max-w-md w-full mx-4 border border-zinc-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-yellow-400">
            Substitution
          </h3>
          <button
            onClick={onCancel}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="mb-4">
          <p className="text-zinc-300 mb-2">
            <span className="text-emerald-400 font-semibold">{playerComingIn.name}</span> is coming in.
          </p>
          <p className="text-zinc-400 text-sm">
            Who should they replace?
          </p>
        </div>
        
        <div className="space-y-2 mb-6">
          {playersOnCourt.map(player => (
            <button
              key={player.id}
              onClick={() => onSubstitute(player.id)}
              className="w-full bg-zinc-800 hover:bg-zinc-700 p-3 rounded-lg text-left flex justify-between items-center transition-colors group"
            >
              <div>
                <span className="text-white font-medium">{player.name}</span>
                <div className="text-sm text-zinc-400">
                  {player.stats.points} pts, {player.stats.fouls} fouls
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-zinc-400">
                  {formatTime(player.stats.timeOnCourt)}
                </div>
                <div className={`text-sm ${player.stats.plusMinus >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  +/- {player.stats.plusMinus > 0 ? '+' : ''}{player.stats.plusMinus}
                </div>
              </div>
            </button>
          ))}
        </div>
        
        <button
          onClick={onCancel}
          className="w-full bg-zinc-700 hover:bg-zinc-600 py-2 rounded-lg transition-colors text-zinc-300"
        >
          Cancel Substitution
        </button>
      </div>
    </div>
  );
}; 