import React from 'react';
import { X, Users } from 'lucide-react';
import { PlayerImage } from '../PlayerProfiles/PlayerImage';

interface PlayerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  availablePlayers: any[];
  onSelectPlayer: (playerId: string) => void;
}

export const PlayerSelectionModal: React.FC<PlayerSelectionModalProps> = ({
  isOpen,
  onClose,
  availablePlayers,
  onSelectPlayer,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg p-6 max-w-md w-full mx-4 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-yellow-400 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Select Player
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {availablePlayers.map((player) => (
            <button
              key={player.id}
              onClick={() => {
                onSelectPlayer(player.id);
                onClose();
              }}
              className="w-full text-left p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-3"
            >
              {/* Player Image */}
              <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-600 flex-shrink-0">
                <PlayerImage 
                  profileImageUrl={player.profileImageUrl}
                  className="w-full h-full object-cover"
                  alt={player.name}
                />
              </div>
              
              <div>
                <div className="font-medium text-white">{player.name}</div>
                {player.position && (
                  <div className="text-sm text-slate-400">{player.position}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}; 