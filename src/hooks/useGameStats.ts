import { useState, useCallback, useEffect } from 'react';
import type { StatType } from '../types/game.types';

interface GamePlayer {
  id: string;
  name: string;
  position?: string;
  profileImageUrl?: string;
  onCourt: boolean;
  stats: {
    points: number;
    fouls: number;
    turnovers: number;
    offRebounds: number;
    defRebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    fgMade: number;
    fgAttempts: number;
    ftMade: number;
    ftAttempts: number;
    plusMinus: number;
    timeOnCourt: number;
  };
  startTime: number | null;
}

interface UseGameStatsResult {
  players: GamePlayer[];
  selectedPlayerId: string | null;
  selectedPlayerName: string | null;
  setSelectedPlayerId: (id: string | null) => void;
  updatePlayerName: (playerId: string, newName: string) => void;
  updatePlayerStat: (playerId: string, statType: StatType, value?: number) => void;
  updatePlusMinus: (points: number, isTeamScore: boolean) => void;
  substitutePlayer: (playerInId: string, playerOutId: string, currentTime: number) => void;
  setPlayers: React.Dispatch<React.SetStateAction<GamePlayer[]>>;
  updateTimeOnCourt: (currentGameTime: number) => void;
}

export const useGameStats = (initialPlayers: GamePlayer[]): UseGameStatsResult => {
  const [players, setPlayers] = useState<GamePlayer[]>(initialPlayers);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);

  // Update players when initialPlayers changes
  useEffect(() => {
    setPlayers(initialPlayers);
  }, [initialPlayers]);

  const selectedPlayerName = players.find(p => p.id === selectedPlayerId)?.name || null;

  const updateTimeOnCourt = useCallback((currentGameTime: number) => {
    const timeDelta = currentGameTime - lastUpdateTime;
    
    if (timeDelta > 0) {
      setPlayers(prevPlayers =>
        prevPlayers.map(player => {
          if (player.onCourt && player.startTime !== null) {
            return {
              ...player,
              stats: {
                ...player.stats,
                timeOnCourt: player.stats.timeOnCourt + timeDelta
              }
            };
          }
          return player;
        })
      );
    }
    
    setLastUpdateTime(currentGameTime);
  }, [lastUpdateTime]);

  const updatePlayerName = useCallback((playerId: string, newName: string) => {
    setPlayers(prevPlayers =>
      prevPlayers.map(player =>
        player.id === playerId
          ? { ...player, name: newName }
          : player
      )
    );
  }, []);

  const updatePlayerStat = useCallback((playerId: string, statType: StatType, value = 1) => {
    setPlayers(prevPlayers => 
      prevPlayers.map(player => {
        if (player.id === playerId) {
          const newStats = { ...player.stats };
          
          switch (statType) {
            case 'points':
              newStats.points += value;
              break;
            case 'fgMade':
              newStats.fgMade += 1;
              newStats.fgAttempts += 1;
              break;
            case 'fgMissed':
              newStats.fgAttempts += 1;
              break;
            case 'ftMade':
              newStats.ftMade += 1;
              newStats.ftAttempts += 1;
              break;
            case 'ftMissed':
              newStats.ftAttempts += 1;
              break;
            case 'fouls':
              newStats.fouls += 1;
              break;
            case 'turnovers':
              newStats.turnovers += 1;
              break;
            case 'offRebounds':
              newStats.offRebounds += 1;
              break;
            case 'defRebounds':
              newStats.defRebounds += 1;
              break;
            case 'assists':
              newStats.assists += 1;
              break;
            case 'steals':
              newStats.steals += 1;
              break;
            case 'blocks':
              newStats.blocks += 1;
              break;
          }
          
          return { ...player, stats: newStats };
        }
        return player;
      })
    );
  }, []);

  const updatePlusMinus = useCallback((points: number, isTeamScore: boolean) => {
    const plusMinusChange = isTeamScore ? points : -points;
    setPlayers(prevPlayers => 
      prevPlayers.map(player => {
        if (player.onCourt) {
          return {
            ...player,
            stats: {
              ...player.stats,
              plusMinus: player.stats.plusMinus + plusMinusChange
            }
          };
        }
        return player;
      })
    );
  }, []);

  const substitutePlayer = useCallback((playerInId: string, playerOutId: string, currentTime: number) => {
    setPlayers(prevPlayers => 
      prevPlayers.map(player => {
        if (player.id === playerOutId) {
          // Update time on court for the player going out
          const timeOnCourt = player.startTime !== null ? 
            player.stats.timeOnCourt + (currentTime - player.startTime) : 
            player.stats.timeOnCourt;
          
          return {
            ...player,
            onCourt: false,
            startTime: null,
            stats: {
              ...player.stats,
              timeOnCourt
            }
          };
        } else if (player.id === playerInId) {
          return {
            ...player,
            onCourt: true,
            startTime: currentTime
          };
        }
        return player;
      })
    );
  }, []);

  return {
    players,
    selectedPlayerId,
    selectedPlayerName,
    setSelectedPlayerId,
    updatePlayerName,
    updatePlayerStat,
    updatePlusMinus,
    substitutePlayer,
    setPlayers,
    updateTimeOnCourt,
  };
}; 