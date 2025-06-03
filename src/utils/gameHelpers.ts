import type { Player, PeriodScore, GameFormat } from '../types/game.types';

/**
 * Create initial players with default stats
 */
export const createInitialPlayers = (): Player[] => {
  return Array.from({ length: 10 }, (_, index) => ({
    id: index + 1,
    name: `Player ${index + 1}`,
    onCourt: index < 5, // First 5 players start on court
    stats: {
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
      timeOnCourt: 0
    },
    startTime: index < 5 ? 0 : null
  }));
};

/**
 * Get period label based on format and period number
 */
export const getPeriodLabel = (period: number, format: GameFormat): string => {
  if (format === 'quarters') {
    return `Q${period}`;
  } else {
    return `Half ${period}`;
  }
};

/**
 * Get maximum periods for game format
 */
export const getMaxPeriods = (format: GameFormat): number => {
  return format === 'quarters' ? 4 : 2;
};

/**
 * Create a period score record
 */
export const createPeriodScore = (
  period: number,
  format: GameFormat,
  teamScore: number,
  opponentScore: number,
  periodStartTeamScore: number,
  periodStartOpponentScore: number
): PeriodScore => {
  return {
    period,
    periodLabel: getPeriodLabel(period, format),
    teamScore: teamScore - periodStartTeamScore,
    opponentScore: opponentScore - periodStartOpponentScore,
    totalTeamScore: teamScore,
    totalOpponentScore: opponentScore
  };
};

/**
 * Check if game is in overtime
 */
export const isOvertime = (period: number, format: GameFormat): boolean => {
  return period > getMaxPeriods(format);
};

/**
 * Get game status text
 */
export const getGameStatus = (period: number, format: GameFormat): string => {
  const maxPeriods = getMaxPeriods(format);
  
  if (period <= maxPeriods) {
    return getPeriodLabel(period, format);
  } else {
    const overtimeNumber = period - maxPeriods;
    return `OT${overtimeNumber > 1 ? overtimeNumber : ''}`;
  }
}; 