import React from 'react';
import type { StatType } from '../../types/game.types';

interface StatButtonsProps {
  selectedPlayerName: string | null;
  onStatUpdate: (statType: StatType, value?: number) => void;
}

export const StatButtons: React.FC<StatButtonsProps> = ({
  selectedPlayerName,
  onStatUpdate,
}) => {
  const isDisabled = !selectedPlayerName;

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
      <h3 className="text-lg font-semibold mb-3 text-yellow-400">
        {selectedPlayerName ? `Recording for: ${selectedPlayerName}` : 'Select a player first'}
      </h3>
      
      {/* Scoring Buttons */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <button
          onClick={() => {
            onStatUpdate('points', 1);
            onStatUpdate('ftMade');
          }}
          className="bg-emerald-600 hover:bg-emerald-700 p-2 rounded text-sm transition-colors disabled:opacity-50"
          disabled={isDisabled}
        >
          1 PT (FT Made)
        </button>
        <button
          onClick={() => {
            onStatUpdate('points', 2);
            onStatUpdate('fgMade');
          }}
          className="bg-emerald-600 hover:bg-emerald-700 p-2 rounded text-sm transition-colors disabled:opacity-50"
          disabled={isDisabled}
        >
          2 PTS
        </button>
        <button
          onClick={() => {
            onStatUpdate('points', 3);
            onStatUpdate('fgMade');
          }}
          className="bg-emerald-600 hover:bg-emerald-700 p-2 rounded text-sm transition-colors disabled:opacity-50"
          disabled={isDisabled}
        >
          3 PTS
        </button>
      </div>
      
      {/* Miss Buttons */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <button
          onClick={() => onStatUpdate('fgMissed')}
          className="bg-slate-700 hover:bg-slate-600 p-2 rounded text-sm transition-colors disabled:opacity-50"
          disabled={isDisabled}
        >
          FG Miss
        </button>
        <button
          onClick={() => onStatUpdate('ftMissed')}
          className="bg-slate-700 hover:bg-slate-600 p-2 rounded text-sm transition-colors disabled:opacity-50"
          disabled={isDisabled}
        >
          FT Miss
        </button>
        <button
          onClick={() => onStatUpdate('turnovers')}
          className="bg-red-600 hover:bg-red-700 p-2 rounded text-sm transition-colors disabled:opacity-50"
          disabled={isDisabled}
        >
          Turnover
        </button>
      </div>
      
      {/* Positive Stats */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => onStatUpdate('assists')}
          className="bg-cyan-600 hover:bg-cyan-700 p-2 rounded text-sm transition-colors disabled:opacity-50"
          disabled={isDisabled}
        >
          Assist
        </button>
        <button
          onClick={() => onStatUpdate('offRebounds')}
          className="bg-cyan-600 hover:bg-cyan-700 p-2 rounded text-sm transition-colors disabled:opacity-50"
          disabled={isDisabled}
        >
          Off Reb
        </button>
        <button
          onClick={() => onStatUpdate('defRebounds')}
          className="bg-cyan-600 hover:bg-cyan-700 p-2 rounded text-sm transition-colors disabled:opacity-50"
          disabled={isDisabled}
        >
          Def Reb
        </button>
        <button
          onClick={() => onStatUpdate('steals')}
          className="bg-indigo-600 hover:bg-indigo-700 p-2 rounded text-sm transition-colors disabled:opacity-50"
          disabled={isDisabled}
        >
          Steal
        </button>
        <button
          onClick={() => onStatUpdate('blocks')}
          className="bg-indigo-600 hover:bg-indigo-700 p-2 rounded text-sm transition-colors disabled:opacity-50"
          disabled={isDisabled}
        >
          Block
        </button>
        <button
          onClick={() => onStatUpdate('fouls')}
          className="bg-amber-600 hover:bg-amber-700 p-2 rounded text-sm transition-colors disabled:opacity-50"
          disabled={isDisabled}
        >
          Foul
        </button>
      </div>
    </div>
  );
}; 