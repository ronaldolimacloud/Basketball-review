import React, { useState } from 'react';
import { X, Plus, Minus, RotateCcw } from 'lucide-react';

interface GamePlayer {
  id: string;
  name: string;
  position?: string;
  profileImageUrl?: string;
  onCourt: boolean;
  stats: {
    points: number;
    fouls: number;
    turnovers: number;
    offRebounds: number;
    defRebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    fgMade: number;
    fgAttempts: number;
    ftMade: number;
    ftAttempts: number;
    plusMinus: number;
    timeOnCourt: number;
  };
  startTime: number | null;
}

interface StatCorrectionModalProps {
  isOpen: boolean;
  player: GamePlayer | null;
  onSave: (playerId: string, newStats: GamePlayer['stats']) => void;
  onCancel: () => void;
}

export const StatCorrectionModal: React.FC<StatCorrectionModalProps> = ({
  isOpen,
  player,
  onSave,
  onCancel,
}) => {
  const [editedStats, setEditedStats] = useState<GamePlayer['stats'] | null>(null);

  // Initialize edited stats when player changes
  React.useEffect(() => {
    if (player) {
      setEditedStats({ ...player.stats });
    }
  }, [player]);

  if (!isOpen || !player || !editedStats) return null;

  const updateStat = (statKey: keyof GamePlayer['stats'], value: number) => {
    setEditedStats(prev => prev ? { ...prev, [statKey]: Math.max(0, value) } : null);
  };

  const incrementStat = (statKey: keyof GamePlayer['stats'], amount: number = 1) => {
    updateStat(statKey, (editedStats[statKey] || 0) + amount);
  };

  const resetStats = () => {
    if (player) {
      setEditedStats({ ...player.stats });
    }
  };

  const handleSave = () => {
    if (editedStats && player) {
      onSave(player.id, editedStats);
    }
  };

  const StatRow: React.FC<{
    label: string;
    statKey: keyof GamePlayer['stats'];
    originalValue: number;
    showDecimals?: boolean;
  }> = ({ label, statKey, originalValue, showDecimals = false }) => {
    const currentValue = editedStats[statKey] || 0;
    const hasChanged = currentValue !== originalValue;

    return (
      <div className="flex items-center justify-between py-2 border-b border-zinc-700 last:border-b-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-zinc-300 w-20">{label}</span>
          {hasChanged && (
            <span className="text-xs text-yellow-400">
              ({originalValue} → {showDecimals ? currentValue.toFixed(1) : currentValue})
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => incrementStat(statKey, -1)}
            className="p-1 bg-red-600 hover:bg-red-700 rounded transition-colors"
            disabled={currentValue <= 0}
          >
            <Minus className="w-3 h-3" />
          </button>
          
          <input
            type="number"
            value={showDecimals ? currentValue.toFixed(1) : currentValue}
            onChange={(e) => {
              const value = showDecimals ? parseFloat(e.target.value) || 0 : parseInt(e.target.value) || 0;
              updateStat(statKey, value);
            }}
            className="w-16 px-2 py-1 bg-zinc-800 border border-zinc-600 rounded text-center text-sm text-white focus:border-yellow-500 focus:outline-none"
            step={showDecimals ? "0.1" : "1"}
            min="0"
          />
          
          <button
            onClick={() => incrementStat(statKey, 1)}
            className="p-1 bg-emerald-600 hover:bg-emerald-700 rounded transition-colors"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg p-6 max-w-md w-full mx-4 border border-zinc-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-yellow-400">
            Edit Stats: {player.name}
          </h3>
          <button
            onClick={onCancel}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1 mb-6">
          {/* Scoring Stats */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-emerald-400 mb-2">Scoring</h4>
            <StatRow label="Points" statKey="points" originalValue={player.stats.points} />
            <StatRow label="FG Made" statKey="fgMade" originalValue={player.stats.fgMade} />
            <StatRow label="FG Att" statKey="fgAttempts" originalValue={player.stats.fgAttempts} />
            <StatRow label="FT Made" statKey="ftMade" originalValue={player.stats.ftMade} />
            <StatRow label="FT Att" statKey="ftAttempts" originalValue={player.stats.ftAttempts} />
          </div>

          {/* Positive Stats */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-cyan-400 mb-2">Positive Stats</h4>
            <StatRow label="Assists" statKey="assists" originalValue={player.stats.assists} />
            <StatRow label="Off Reb" statKey="offRebounds" originalValue={player.stats.offRebounds} />
            <StatRow label="Def Reb" statKey="defRebounds" originalValue={player.stats.defRebounds} />
            <StatRow label="Steals" statKey="steals" originalValue={player.stats.steals} />
            <StatRow label="Blocks" statKey="blocks" originalValue={player.stats.blocks} />
          </div>

          {/* Negative Stats */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-red-400 mb-2">Negative Stats</h4>
            <StatRow label="Fouls" statKey="fouls" originalValue={player.stats.fouls} />
            <StatRow label="Turnovers" statKey="turnovers" originalValue={player.stats.turnovers} />
          </div>

          {/* Advanced Stats */}
          <div>
            <h4 className="text-sm font-medium text-indigo-400 mb-2">Advanced</h4>
            <StatRow label="+/-" statKey="plusMinus" originalValue={player.stats.plusMinus} />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={resetStats}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors text-zinc-300"
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
            className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors text-white font-medium"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}; 