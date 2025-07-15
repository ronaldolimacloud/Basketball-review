import React from 'react';
import type { StatType } from '../../types/game.types';
import { GameButton } from '../ui/GameButton';
import { Timer } from 'lucide-react';
import { PlayerImage } from '../PlayerProfiles/PlayerImage';

interface StatButtonsProps {
  selectedPlayerName: string | null;
  selectedPlayer?: {
    id: string;
    name: string;
    profileImageUrl?: string;
  } | null;
  onStatUpdate: (statType: StatType, value?: number) => void;
  isGameStarted?: boolean;
  onOpponentScore?: (points: number) => void;
  onTeamTimeout?: () => void;
  onOpponentTimeout?: () => void;
  teamName?: string;
  opponentName?: string;
}

export const StatButtons: React.FC<StatButtonsProps> = ({
  selectedPlayerName,
  selectedPlayer,
  onStatUpdate,
  isGameStarted = false,
  onOpponentScore,
  onTeamTimeout,
  onOpponentTimeout,
  teamName = 'Team',
  opponentName = 'Opponent',
}) => {
  const isDisabled = !selectedPlayerName || !isGameStarted;

  return (
    <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-600">
      <h3 className="text-lg font-semibold mb-3 text-yellow-400">
        {!isGameStarted ? 'Start the game clock to record stats' : 
         selectedPlayer ? (
          <div className="flex items-center gap-2">
            <span>Recording for:</span>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-zinc-600 flex-shrink-0">
                <PlayerImage 
                  profileImageUrl={selectedPlayer.profileImageUrl}
                  className="w-full h-full object-cover"
                  alt={selectedPlayer.name}
                />
              </div>
              <span>{selectedPlayer.name}</span>
            </div>
          </div>
         ) : 'Select a player first'}
      </h3>
      
      {/* Scoring Buttons */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <GameButton variant="primary" className="p-2 text-sm font-bold"
          onClick={() => {
            onStatUpdate('points', 1);
            onStatUpdate('ftMade');
          }}
          disabled={isDisabled}
        >
          1 PT (FT Made)
        </GameButton>
        <GameButton variant="primary" className="p-2 text-sm font-bold"
          onClick={() => {
            onStatUpdate('points', 2);
            onStatUpdate('fgMade');
          }}
          disabled={isDisabled}
        >
          2 PTS
        </GameButton>
        <GameButton variant="primary" className="p-2 text-sm font-bold"
          onClick={() => {
            onStatUpdate('points', 3);
            onStatUpdate('fgMade');
          }}
          disabled={isDisabled}
        >
          3 PTS
        </GameButton>
      </div>
      
      {/* Miss Buttons */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <GameButton variant="primary" className="p-2 text-sm font-bold"
          onClick={() => onStatUpdate('fgMissed')}
          disabled={isDisabled}
        >
          FG Miss
        </GameButton>
        <GameButton variant="primary" className="p-2 text-sm font-bold"
          onClick={() => onStatUpdate('ftMissed')}
          disabled={isDisabled}
        >
          FT Miss
        </GameButton>
        <GameButton variant="primary" className="px-6 py-3 text-sm font-bold"
          onClick={() => onStatUpdate('turnovers')}
          disabled={isDisabled}
        >
          Turnover
        </GameButton>
      </div>
      
      {/* Positive Stats */}
      <div className="grid grid-cols-3 gap-2">
        <GameButton variant="primary" className="p-2 text-sm font-bold"
          onClick={() => onStatUpdate('assists')}
          disabled={isDisabled}
        >
          Assist
        </GameButton>
        <GameButton variant="primary" className="p-2 text-sm font-bold"
          onClick={() => onStatUpdate('offRebounds')}
          disabled={isDisabled}
        >
          Off Reb
        </GameButton>
        <GameButton variant="primary" className="p-2 text-sm font-bold"
          onClick={() => onStatUpdate('defRebounds')}
          disabled={isDisabled}
        >
          Def Reb
        </GameButton>
        <GameButton variant="primary" className="p-2 text-sm font-bold"
          onClick={() => onStatUpdate('steals')}
          disabled={isDisabled}
        >
          Steal
        </GameButton>
        <GameButton variant="primary" className="p-2 text-sm font-bold"
          onClick={() => onStatUpdate('blocks')}
          disabled={isDisabled}
        >
          Block
        </GameButton>
        <GameButton variant="primary" className="p-2 text-sm font-bold"
          onClick={() => onStatUpdate('fouls')}
          disabled={isDisabled}
        >
          Foul
        </GameButton>
      </div>
      
      {/* Game Management Section */}
      <div className="mt-4 pt-4 border-t border-zinc-600">
        <h4 className="text-md font-medium text-zinc-400 mb-3">Game Management</h4>
        
        {/* Opponent Scoring */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <GameButton 
            variant="primary" 
            className="p-2 text-sm font-bold" 
            onClick={() => onOpponentScore?.(1)}
            disabled={!isGameStarted}
          >
            {opponentName} +1
          </GameButton>
          <GameButton 
            variant="primary" 
            className="p-2 text-sm font-bold" 
            onClick={() => onOpponentScore?.(2)}
            disabled={!isGameStarted}
          >
            {opponentName} +2
          </GameButton>
          <GameButton 
            variant="primary" 
            className="p-2 text-sm font-bold" 
            onClick={() => onOpponentScore?.(3)}
            disabled={!isGameStarted}
          >
            {opponentName} +3
          </GameButton>
        </div>
        
        {/* Timeout Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <GameButton 
            variant="primary" 
            className="p-2 text-sm flex items-center justify-center gap-2 font-bold" 
            onClick={onTeamTimeout}
            disabled={!isGameStarted}
          >
            <Timer className="w-4 h-4" />
            {teamName} Timeout
          </GameButton>
          <GameButton 
            variant="primary" 
            className="p-2 text-sm flex items-center justify-center gap-2 font-bold" 
            onClick={onOpponentTimeout}
            disabled={!isGameStarted}
          >
            <Timer className="w-4 h-4" />
            {opponentName} Timeout
          </GameButton>
        </div>
      </div>
    </div>
  );
}; 