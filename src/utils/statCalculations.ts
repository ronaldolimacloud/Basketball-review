import type { Player } from '../types/game.types';

/**
 * Calculate field goal percentage
 */
export const calculateFGPercentage = (made: number, attempts: number): string => {
  if (attempts === 0) return '0.0';
  return ((made / attempts) * 100).toFixed(1);
};

/**
 * Calculate free throw percentage
 */
export const calculateFTPercentage = (made: number, attempts: number): string => {
  if (attempts === 0) return '0.0';
  return ((made / attempts) * 100).toFixed(1);
};

/**
 * Calculate total rebounds for a player
 */
export const calculateTotalRebounds = (offRebounds: number, defRebounds: number): number => {
  return offRebounds + defRebounds;
};

/**
 * Calculate team fouls from all players
 */
export const calculateTeamFouls = (players: Player[]): number => {
  return players.reduce((total, player) => total + player.stats.fouls, 0);
};

/**
 * Calculate team points from all players
 */
export const calculateTeamPoints = (players: Player[]): number => {
  return players.reduce((total, player) => total + player.stats.points, 0);
};

/**
 * Get players currently on court
 */
export const getPlayersOnCourt = (players: Player[]): Player[] => {
  return players.filter(player => player.onCourt);
};

/**
 * Get players currently on bench
 */
export const getPlayersOnBench = (players: Player[]): Player[] => {
  return players.filter(player => !player.onCourt);
};

/**
 * Validate if substitution is allowed (max 5 players on court)
 */
export const canMakeSubstitution = (players: Player[], playerInId: number): boolean => {
  const playersOnCourt = getPlayersOnCourt(players);
  const playerIn = players.find(p => p.id === playerInId);
  
  if (!playerIn || playerIn.onCourt) return false;
  
  return playersOnCourt.length >= 1; // Need at least 1 player on court to substitute
};

/**
 * Calculate efficiency rating (simplified version)
 */
export const calculatePlayerEfficiency = (player: Player): number => {
  const stats = player.stats;
  return stats.points + stats.assists + calculateTotalRebounds(stats.offRebounds, stats.defRebounds) 
         + stats.steals + stats.blocks - stats.turnovers - stats.fouls;
}; 