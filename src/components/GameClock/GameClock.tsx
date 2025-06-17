import React from 'react';
import { Clock } from 'lucide-react';

interface GameClockProps {
  gameClock: number;
  isClockRunning: boolean;
  currentPeriod: number;
  gameFormat: 'quarters' | 'halves';
  onClockToggle: () => void;
  onPeriodChange: (period: number) => void;
  onEndPeriod: () => void;
}

export const GameClock: React.FC<GameClockProps> = ({
  gameClock,
  isClockRunning,
  currentPeriod,
  gameFormat,
  onClockToggle,
  onPeriodChange,
  onEndPeriod,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPeriodLabel = () => {
    if (gameFormat === 'quarters') {
      return `Q${currentPeriod}`;
    } else {
      return `Half ${currentPeriod}`;
    }
  };

  const getMaxPeriods = () => {
    return gameFormat === 'quarters' ? 4 : 2;
  };

  return (
    <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-600">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-yellow-400">
          <Clock className="w-5 h-5" />
          Game Clock - {getPeriodLabel()}
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPeriodChange(Math.max(1, currentPeriod - 1))}
              className="bg-zinc-700 hover:bg-zinc-600 px-2 py-1 rounded text-sm transition-colors"
              disabled={currentPeriod === 1}
            >
              -
            </button>
            <span className="text-lg font-semibold text-yellow-400">{getPeriodLabel()}</span>
            <button
              onClick={() => onPeriodChange(Math.min(getMaxPeriods(), currentPeriod + 1))}
              className="bg-zinc-700 hover:bg-zinc-600 px-2 py-1 rounded text-sm transition-colors"
              disabled={currentPeriod === getMaxPeriods()}
            >
              +
            </button>
          </div>
          <span className="text-2xl font-mono text-yellow-400">{formatTime(gameClock)}</span>
          <button
            onClick={onClockToggle}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isClockRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isClockRunning ? 'Stop' : 'Start'}
          </button>
        </div>
      </div>
      
      <div className="flex justify-center">
        <button
          onClick={onEndPeriod}
          className="bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          End {gameFormat === 'quarters' ? 'Quarter' : 'Half'}
        </button>
      </div>
    </div>
  );
}; 