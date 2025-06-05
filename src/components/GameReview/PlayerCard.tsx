import React from 'react';
import { PlayerImage } from '../PlayerProfiles/PlayerImage';

interface PlayerCardProps {
  player: {
    id: string;
    name: string;
    position?: string;
    profileImageUrl?: string;
  };
  isSelected: boolean;
  onSelect: () => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, isSelected, onSelect }) => {
  return (
    <div 
      onClick={onSelect}
      className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-3 ${
        isSelected
          ? 'border-yellow-500 bg-yellow-500/10'
          : 'border-slate-600 bg-slate-800 hover:border-slate-500'
      }`}
    >
      {/* Player Image */}
      <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-600 flex-shrink-0">
        <PlayerImage 
          profileImageUrl={player.profileImageUrl}
          className="w-full h-full object-cover"
          alt={player.name}
        />
      </div>
      
      {/* Player Info */}
      <div>
        <h3 className="font-medium text-white">{player.name}</h3>
        {player.position && (
          <div className="text-xs text-slate-400 mt-0.5">
            {player.position}
          </div>
        )}
      </div>
      
      {/* Selection Indicator */}
      {isSelected && (
        <div className="ml-auto w-3 h-3 bg-yellow-500 rounded-full"></div>
      )}
    </div>
  );
};