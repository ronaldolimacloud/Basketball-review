import React from 'react';
import { Users } from 'lucide-react';
import { PlayerCard } from './PlayerCard';
import type { Player } from '../../types/game.types';

interface PlayerListProps {
  players: Player[];
  selectedPlayerId: number | null;
  onPlayerSelect: (playerId: number) => void;
  onPlayerNameEdit: (playerId: number, newName: string) => void;
  onSubstitutionRequest: (playerInId: number) => void;
}

export const PlayerList: React.FC<PlayerListProps> = ({
  players,
  selectedPlayerId,
  onPlayerSelect,
  onPlayerNameEdit,
  onSubstitutionRequest,
}) => {
  const onCourtPlayers = players.filter(p => p.onCourt);
  const benchPlayers = players.filter(p => !p.onCourt);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
      {/* On Court */}
      <div>
        <h3 className="text-lg font-semibold mb-2 text-emerald-100 flex items-center gap-2">
          <Users className="w-5 h-5" />
          On Court ({onCourtPlayers.length}/5)
        </h3>
        <div className="space-y-2">
          {onCourtPlayers.map(player => (
            <PlayerCard
              key={player.id}
              player={player}
              isSelected={selectedPlayerId === player.id}
              isOnCourt={true}
              onSelect={() => onPlayerSelect(player.id)}
              onEdit={(newName) => onPlayerNameEdit(player.id, newName)}
            />
          ))}
          {onCourtPlayers.length === 0 && (
            <div className="text-zinc-400 text-sm italic p-4 text-center">
              No players on court
            </div>
          )}
        </div>
      </div>
      
      {/* Bench */}
      <div>
        <h3 className="text-lg font-semibold mb-2 text-zinc-400 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Bench ({benchPlayers.length})
        </h3>
        <div className="space-y-2">
          {benchPlayers.map(player => (
            <PlayerCard
              key={player.id}
              player={player}
              isSelected={false}
              isOnCourt={false}
              onSelect={() => {}}
              onEdit={(newName) => onPlayerNameEdit(player.id, newName)}
              onSubstitute={() => onSubstitutionRequest(player.id)}
            />
          ))}
          {benchPlayers.length === 0 && (
            <div className="text-zinc-400 text-sm italic p-4 text-center">
              No players on bench
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 