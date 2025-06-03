import { useState, useEffect } from 'react';
import type { Player } from '../types/game.types';

export const useGameClock = (onPlayersUpdate: (updater: (players: Player[]) => Player[]) => void) => {
  const [gameClock, setGameClock] = useState(0);
  const [isClockRunning, setIsClockRunning] = useState(false);

  useEffect(() => {
    let interval: number | null = null;
    
    if (isClockRunning) {
      interval = setInterval(() => {
        setGameClock(prev => prev + 1);
        // Update time for players on court
        onPlayersUpdate(prevPlayers => 
          prevPlayers.map(player => {
            if (player.onCourt) {
              return {
                ...player,
                stats: {
                  ...player.stats,
                  timeOnCourt: player.stats.timeOnCourt + 1
                }
              };
            }
            return player;
          })
        );
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isClockRunning, onPlayersUpdate]);

  const toggleClock = () => {
    setIsClockRunning(!isClockRunning);
  };

  const resetClock = () => {
    setIsClockRunning(false);
    setGameClock(0);
  };

  return {
    gameClock,
    isClockRunning,
    toggleClock,
    resetClock,
  };
}; 