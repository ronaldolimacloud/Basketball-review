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
  correctPlayerStats: (playerId: string, newStats: GamePlayer['stats'], onTeamScoreChange?: (pointsDifference: number) => void) => void;
  resetPlayerStats: (playerId: string, onTeamScoreChange?: (pointsDifference: number) => void) => void;
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
    // First, update all on-court players' time to ensure accurate tracking
    updateTimeOnCourt(currentTime);
    
    setPlayers(prevPlayers => {
      console.log('Before substitution:', {
        onCourtCount: prevPlayers.filter(p => p.onCourt).length,
        onCourtPlayers: prevPlayers.filter(p => p.onCourt).map(p => ({ id: p.id, name: p.name })),
        playerInId,
        playerOutId
      });
      
      const updatedPlayers = prevPlayers.map(player => {
        if (player.id === playerOutId) {
          console.log('Setting player OUT:', player.name, player.id);
          // Player going out: set onCourt to false and startTime to null
          // The time calculation was already done in updateTimeOnCourt above
          return {
            ...player,
            onCourt: false,
            startTime: null
          };
        } else if (player.id === playerInId) {
          console.log('Setting player IN:', player.name, player.id);
          // Player coming in: set onCourt to true and startTime to current time
          return {
            ...player,
            onCourt: true,
            startTime: currentTime
          };
        }
        return player;
      });
      
      console.log('After substitution:', {
        onCourtCount: updatedPlayers.filter(p => p.onCourt).length,
        onCourtPlayers: updatedPlayers.filter(p => p.onCourt).map(p => ({ id: p.id, name: p.name }))
      });
      
      return updatedPlayers;
    });
  }, [updateTimeOnCourt]);

  const correctPlayerStats = useCallback((playerId: string, newStats: GamePlayer['stats'], onTeamScoreChange?: (pointsDifference: number) => void) => {
    setPlayers(prevPlayers => {
      const targetPlayer = prevPlayers.find(p => p.id === playerId);
      if (!targetPlayer) return prevPlayers;

      const oldStats = targetPlayer.stats;
      const pointsDifference = newStats.points - oldStats.points;
      
      // If points changed, notify parent component to update team score
      if (pointsDifference !== 0 && onTeamScoreChange) {
        onTeamScoreChange(pointsDifference);
      }

      console.log('Stat correction:', {
        playerId,
        playerName: targetPlayer.name,
        oldPoints: oldStats.points,
        newPoints: newStats.points,
        pointsDifference,
        oldStats: oldStats,
        newStats: newStats
      });

      return prevPlayers.map(player => {
        if (player.id === playerId) {
          return {
            ...player,
            stats: { ...newStats }
          };
        }
        return player;
      });
    });
  }, []);

  const resetPlayerStats = useCallback((playerId: string, onTeamScoreChange?: (pointsDifference: number) => void) => {
    setPlayers(prevPlayers => {
      const targetPlayer = prevPlayers.find(p => p.id === playerId);
      if (!targetPlayer) return prevPlayers;

      const oldPoints = targetPlayer.stats.points;
      
      // Reset stats to zero but keep timeOnCourt
      const resetStats: GamePlayer['stats'] = {
        points: 0,
        fouls: 0,
        turnovers: 0,
        offRebounds: 0,
        defRebounds: 0,
        assists: 0,
        steals: 0,
        blocks: 0,
        fgMade: 0,
        fgAttempts: 0,
        ftMade: 0,
        ftAttempts: 0,
        plusMinus: 0,
        timeOnCourt: targetPlayer.stats.timeOnCourt // Keep time tracking
      };

      // If player had points, subtract them from team score
      if (oldPoints > 0 && onTeamScoreChange) {
        onTeamScoreChange(-oldPoints);
      }

      console.log('Player stats reset:', {
        playerId,
        playerName: targetPlayer.name,
        oldPoints,
        pointsRemoved: oldPoints
      });

      return prevPlayers.map(player => {
        if (player.id === playerId) {
          return {
            ...player,
            stats: resetStats
          };
        }
        return player;
      });
    });
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
    correctPlayerStats,
    resetPlayerStats,
  };
}; 