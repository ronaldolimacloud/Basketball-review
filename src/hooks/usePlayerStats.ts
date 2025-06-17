import { useState, useCallback } from 'react';
import type { Player, StatType } from '../types/game.types';

interface UsePlayerStatsResult {
  players: Player[];
  selectedPlayerId: number | null;
  selectedPlayerName: string | null;
  setSelectedPlayerId: (id: number | null) => void;
  updatePlayerName: (playerId: number, newName: string) => void;
  updatePlayerStat: (playerId: number, statType: StatType, value?: number) => void;
  updatePlusMinus: (points: number, isTeamScore: boolean) => void;
  substitutePlayer: (playerInId: number, playerOutId: number, currentTime: number) => void;
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
}

export const usePlayerStats = (initialPlayers: Player[]): UsePlayerStatsResult => {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);

  const selectedPlayerName = players.find(p => p.id === selectedPlayerId)?.name || null;

  const updatePlayerName = useCallback((playerId: number, newName: string) => {
    setPlayers(prevPlayers =>
      prevPlayers.map(player =>
        player.id === playerId
          ? { ...player, name: newName }
          : player
      )
    );
  }, []);

  const updatePlayerStat = useCallback((playerId: number, statType: StatType, value = 1) => {
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

  const substitutePlayer = useCallback((playerInId: number, playerOutId: number, currentTime: number) => {
    setPlayers(prevPlayers => 
      prevPlayers.map(player => {
        if (player.id === playerOutId) {
          return {
            ...player,
            onCourt: false,
            startTime: null
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
  };
}; 