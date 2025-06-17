import { useState, useEffect, useRef } from 'react';
import type { Player } from '../types/game.types';

export const useGameClock = (onPlayersUpdate: (updater: (players: Player[]) => Player[]) => void) => {
  const [gameClock, setGameClock] = useState(0);
  const [isClockRunning, setIsClockRunning] = useState(false);
  const onPlayersUpdateRef = useRef(onPlayersUpdate);

  // Keep the callback reference up to date
  useEffect(() => {
    onPlayersUpdateRef.current = onPlayersUpdate;
  }, [onPlayersUpdate]);

  useEffect(() => {
    let interval: number | null = null;
    
    if (isClockRunning) {
      interval = setInterval(() => {
        setGameClock(prev => prev + 1);
        // Update time for players on court using stable ref
        onPlayersUpdateRef.current(prevPlayers => 
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
  }, [isClockRunning]); // Removed onPlayersUpdate dependency

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