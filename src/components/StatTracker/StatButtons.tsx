import React from 'react';
import type { StatType } from '../../types/game.types';
import Button from '../ui/Button';
import { Timer } from 'lucide-react';

interface StatButtonsProps {
  selectedPlayerName: string | null;
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
         selectedPlayerName ? `Recording for: ${selectedPlayerName}` : 'Select a player first'}
      </h3>
      
      {/* Scoring Buttons */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Button variant="success" className="p-2 text-sm debug-red !bg-red-500"
          onClick={() => {
            onStatUpdate('points', 1);
            onStatUpdate('ftMade');
          }}
          disabled={isDisabled}
        >
          1 PT (FT Made)
        </Button>
        <Button variant="success" className="p-2 text-sm"
          onClick={() => {
            onStatUpdate('points', 2);
            onStatUpdate('fgMade');
          }}
          disabled={isDisabled}
        >
          2 PTS
        </Button>
        <Button variant="success" className="p-2 text-sm"
          onClick={() => {
            onStatUpdate('points', 3);
            onStatUpdate('fgMade');
          }}
          disabled={isDisabled}
        >
          3 PTS
        </Button>
      </div>
      
      {/* Miss Buttons */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Button variant="secondary" className="p-2 text-sm"
          onClick={() => onStatUpdate('fgMissed')}
          disabled={isDisabled}
        >
          FG Miss
        </Button>
        <Button variant="secondary" className="p-2 text-sm"
          onClick={() => onStatUpdate('ftMissed')}
          disabled={isDisabled}
        >
          FT Miss
        </Button>
        <Button variant="primary" className="px-6 py-3 text-sm font-bold"
          onClick={() => onStatUpdate('turnovers')}
          disabled={isDisabled}
        >
          Turnover
        </Button>
      </div>
      
      {/* Positive Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Button variant="info" className="p-2 text-sm"
          onClick={() => onStatUpdate('assists')}
          disabled={isDisabled}
        >
          Assist
        </Button>
        <Button variant="info" className="p-2 text-sm"
          onClick={() => onStatUpdate('offRebounds')}
          disabled={isDisabled}
        >
          Off Reb
        </Button>
        <Button variant="info" className="p-2 text-sm"
          onClick={() => onStatUpdate('defRebounds')}
          disabled={isDisabled}
        >
          Def Reb
        </Button>
        <Button variant="indigo" className="p-2 text-sm"
          onClick={() => onStatUpdate('steals')}
          disabled={isDisabled}
        >
          Steal
        </Button>
        <Button variant="indigo" className="p-2 text-sm"
          onClick={() => onStatUpdate('blocks')}
          disabled={isDisabled}
        >
          Block
        </Button>
        <Button variant="warning" className="p-2 text-sm"
          onClick={() => onStatUpdate('fouls')}
          disabled={isDisabled}
        >
          Foul
        </Button>
      </div>
      
      {/* Game Management Section */}
      <div className="mt-4 pt-4 border-t border-zinc-600">
        <h4 className="text-md font-medium text-zinc-400 mb-3">Game Management</h4>
        
        {/* Opponent Scoring */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <Button 
            variant="danger" 
            className="p-2 text-sm font-bold" 
            onClick={() => onOpponentScore?.(1)}
            disabled={!isGameStarted}
          >
            {opponentName} +1
          </Button>
          <Button 
            variant="danger" 
            className="p-2 text-sm font-bold" 
            onClick={() => onOpponentScore?.(2)}
            disabled={!isGameStarted}
          >
            {opponentName} +2
          </Button>
          <Button 
            variant="danger" 
            className="p-2 text-sm font-bold" 
            onClick={() => onOpponentScore?.(3)}
            disabled={!isGameStarted}
          >
            {opponentName} +3
          </Button>
        </div>
        
        {/* Timeout Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="secondary" 
            className="p-2 text-sm flex items-center justify-center gap-2" 
            onClick={onTeamTimeout}
            disabled={!isGameStarted}
          >
            <Timer className="w-4 h-4" />
            {teamName} Timeout
          </Button>
          <Button 
            variant="secondary" 
            className="p-2 text-sm flex items-center justify-center gap-2" 
            onClick={onOpponentTimeout}
            disabled={!isGameStarted}
          >
            <Timer className="w-4 h-4" />
            {opponentName} Timeout
          </Button>
        </div>
      </div>
    </div>
  );
}; 