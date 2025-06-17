import React, { useState } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import type { Player } from '../../types/game.types';
import { PlayerImage } from '../PlayerProfiles/PlayerImage';

interface PlayerCardProps {
  player: Player;
  isSelected: boolean;
  isOnCourt: boolean;
  onSelect: () => void;
  onEdit: (newName: string) => void;
  onSubstitute?: () => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isSelected,
  isOnCourt,
  onSelect,
  onEdit,
  onSubstitute,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(player.name);

  const handleSave = () => {
    if (editName.trim()) {
      onEdit(editName.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(player.name);
    setIsEditing(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      onClick={isOnCourt ? onSelect : undefined}
      className={`bg-zinc-800 p-2 rounded transition-all ${
        isOnCourt
          ? `cursor-pointer ${
              isSelected ? 'ring-2 ring-yellow-500 bg-zinc-700' : 'hover:bg-zinc-700'
            }`
          : ''
      }`}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {/* Profile Picture */}
          <div className="w-8 h-8 rounded-full bg-zinc-700 border border-zinc-600 overflow-hidden flex items-center justify-center flex-shrink-0">
            <PlayerImage 
              profileImageUrl={player.profileImageUrl}
              className="w-full h-full rounded-full"
              alt={player.name}
            />
          </div>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                className="bg-zinc-600 px-2 py-1 rounded text-sm text-white border border-zinc-500 focus:border-yellow-500 focus:outline-none"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave();
                }}
                className="text-emerald-500 hover:text-emerald-400"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancel();
                }}
                className="text-red-500 hover:text-red-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <span className="font-medium text-white">{player.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditName(player.name);
                  setIsEditing(true);
                }}
                className="text-zinc-400 hover:text-white"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isOnCourt ? (
            <span className="text-sm text-zinc-400">
              {formatTime(player.stats.timeOnCourt)} | +/- 
              <span className={player.stats.plusMinus >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                {player.stats.plusMinus > 0 ? '+' : ''}{player.stats.plusMinus}
              </span>
            </span>
          ) : (
            onSubstitute && (
              <button
                onClick={onSubstitute}
                className="bg-emerald-600 hover:bg-emerald-700 px-2 py-1 rounded text-xs transition-colors"
              >
                Sub In
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}; 