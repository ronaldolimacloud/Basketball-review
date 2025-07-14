import React from 'react';
import { Clock } from 'lucide-react';
import Button from '../ui/Button';

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
    <div className="flex items-center gap-4">
      <Clock className="w-5 h-5 text-yellow-400" />
      <span className="text-2xl font-mono text-yellow-400">{formatTime(gameClock)}</span>
      <Button
        onClick={onClockToggle}
        variant={isClockRunning ? 'danger' : 'success'}
        className="px-4 py-2"
      >
        {isClockRunning ? 'Stop' : 'Start'}
      </Button>
      <Button
        onClick={onEndPeriod}
        variant="warning"
        className="px-4 py-2 font-semibold"
      >
        End {gameFormat === 'quarters' ? 'Quarter' : 'Half'}
      </Button>
    </div>
  );
}; 