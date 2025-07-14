import React from 'react';
import { Timer } from 'lucide-react';
import Button from '../ui/Button';
import { GameClock } from '../GameClock';

interface ScoreBoardProps {
  teamName: string;
  opponentName: string;
  teamScore: number;
  opponentScore: number;
  teamFouls: number;
  teamTimeouts: number;
  opponentTimeouts: number;
  onOpponentScore: (points: number) => void;
  onTeamTimeout: () => void;
  onOpponentTimeout: () => void;
  // Game clock props
  gameClock?: number;
  isClockRunning?: boolean;
  currentPeriod?: number;
  gameFormat?: 'quarters' | 'halves';
  onClockToggle?: () => void;
  onPeriodChange?: (period: number) => void;
  onEndPeriod?: () => void;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  teamName,
  opponentName,
  teamScore,
  opponentScore,
  teamFouls,
  teamTimeouts,
  onOpponentScore,
  onTeamTimeout,
  onOpponentTimeout,
  // Game clock props
  gameClock,
  isClockRunning,
  currentPeriod,
  gameFormat,
  onClockToggle,
  onPeriodChange,
  onEndPeriod,
}) => {
  return (
    <div className="bg-zinc-800 rounded-lg p-4 mb-4 border border-zinc-600">
      <div className="text-center text-3xl font-bold mb-2">
        <span className="text-white">{teamName}: {teamScore}</span>
        <span className="mx-3 text-zinc-400">-</span>
        <span className="text-white">{opponentName}: {opponentScore}</span>
      </div>
      
      <div className="flex justify-center items-center gap-4 mb-2">
        <div className="text-sm">
          <span className="text-zinc-400">Team Fouls:</span>
          <span className="ml-2 font-semibold text-amber-400">{teamFouls}</span>
        </div>
        <div className="text-sm">
          <span className="text-zinc-400">Timeouts:</span>
          <span className="ml-2 font-semibold text-yellow-400">{teamTimeouts}</span>
        </div>
      </div>
      
      <div className="flex justify-center gap-2 mb-4">
        <Button variant="primary" className="px-6 py-3 font-bold" onClick={() => onOpponentScore(1)}>
          {opponentName} +1
        </Button>
        <Button variant="primary" className="px-6 py-3 font-bold" onClick={() => onOpponentScore(2)}>
          {opponentName} +2
        </Button>
        <Button variant="primary" className="px-6 py-3 font-bold" onClick={() => onOpponentScore(3)}>
          {opponentName} +3
        </Button>
      </div>

      {/* Game Clock */}
      {gameClock !== undefined && onClockToggle && onEndPeriod && currentPeriod && gameFormat && (
        <div className="mb-4 border-t border-zinc-600 pt-4">
          <GameClock
            gameClock={gameClock}
            isClockRunning={isClockRunning || false}
            currentPeriod={currentPeriod}
            gameFormat={gameFormat}
            onClockToggle={onClockToggle}
            onPeriodChange={onPeriodChange || (() => {})}
            onEndPeriod={onEndPeriod}
          />
        </div>
      )}

      {/* Timeout buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" className="p-2 text-sm flex items-center justify-center gap-2" onClick={onTeamTimeout}>
          <Timer className="w-4 h-4" />
          {teamName} Timeout
        </Button>
        <Button variant="secondary" className="p-2 text-sm flex items-center justify-center gap-2" onClick={onOpponentTimeout}>
          <Timer className="w-4 h-4" />
          {opponentName} Timeout
        </Button>
      </div>
    </div>
  );
}; 