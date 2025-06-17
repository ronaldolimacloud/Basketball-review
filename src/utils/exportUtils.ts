import type { Player } from '../types/game.types';
import { calculateFGPercentage, calculateFTPercentage, calculateTotalRebounds } from './statCalculations';
import { formatTime } from './timeFormatters';

export interface GameSummary {
  gameInfo: {
    teamName: string;
    opponentName: string;
    finalScore: string;
    gameDate: string;
    totalDuration: string;
  };
  players: Player[];
}

export const exportGameSummaryAsCSV = (gameSummary: GameSummary): void => {
  const { gameInfo, players } = gameSummary;
  
  // Create CSV headers
  const headers = [
    'Player Name',
    'Minutes',
    'Points',
    'Field Goals Made',
    'Field Goals Attempted',
    'FG%',
    'Free Throws Made',
    'Free Throws Attempted',
    'FT%',
    'Offensive Rebounds',
    'Defensive Rebounds',
    'Total Rebounds',
    'Assists',
    'Steals',
    'Blocks',
    'Turnovers',
    'Personal Fouls',
    'Plus/Minus'
  ];

  // Create CSV rows
  const rows = players.map(player => [
    player.name,
    formatTime(player.stats.timeOnCourt),
    player.stats.points.toString(),
    player.stats.fgMade.toString(),
    player.stats.fgAttempts.toString(),
    `${calculateFGPercentage(player.stats.fgMade, player.stats.fgAttempts)}%`,
    player.stats.ftMade.toString(),
    player.stats.ftAttempts.toString(),
    `${calculateFTPercentage(player.stats.ftMade, player.stats.ftAttempts)}%`,
    player.stats.offRebounds.toString(),
    player.stats.defRebounds.toString(),
    calculateTotalRebounds(player.stats.offRebounds, player.stats.defRebounds).toString(),
    player.stats.assists.toString(),
    player.stats.steals.toString(),
    player.stats.blocks.toString(),
    player.stats.turnovers.toString(),
    player.stats.fouls.toString(),
    (player.stats.plusMinus > 0 ? '+' : '') + player.stats.plusMinus.toString()
  ]);

  // Add game info header
  const gameInfoRows = [
    ['GAME SUMMARY'],
    ['Team', gameInfo.teamName],
    ['Opponent', gameInfo.opponentName],
    ['Final Score', gameInfo.finalScore],
    ['Game Date', gameInfo.gameDate],
    ['Duration', gameInfo.totalDuration],
    [''], // Empty row
    ['PLAYER STATISTICS'],
    headers
  ];

  // Combine all rows
  const allRows = [...gameInfoRows, ...rows];

  // Convert to CSV string
  const csvContent = allRows.map(row => 
    row.map(field => 
      // Escape fields that contain commas or quotes
      field.includes(',') || field.includes('"') 
        ? `"${field.replace(/"/g, '""')}"` 
        : field
    ).join(',')
  ).join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${gameInfo.teamName}_vs_${gameInfo.opponentName}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportGameSummaryAsJSON = (gameSummary: GameSummary): void => {
  const { gameInfo, players } = gameSummary;

  // Create enhanced data structure for JSON export
  const exportData = {
    gameInfo,
    teamStats: {
      totalPoints: players.reduce((sum, p) => sum + p.stats.points, 0),
      totalFouls: players.reduce((sum, p) => sum + p.stats.fouls, 0),
      totalAssists: players.reduce((sum, p) => sum + p.stats.assists, 0),
      totalRebounds: players.reduce((sum, p) => sum + calculateTotalRebounds(p.stats.offRebounds, p.stats.defRebounds), 0),
      totalSteals: players.reduce((sum, p) => sum + p.stats.steals, 0),
      totalBlocks: players.reduce((sum, p) => sum + p.stats.blocks, 0),
      totalTurnovers: players.reduce((sum, p) => sum + p.stats.turnovers, 0),
      teamFGMade: players.reduce((sum, p) => sum + p.stats.fgMade, 0),
      teamFGAttempts: players.reduce((sum, p) => sum + p.stats.fgAttempts, 0),
      teamFTMade: players.reduce((sum, p) => sum + p.stats.ftMade, 0),
      teamFTAttempts: players.reduce((sum, p) => sum + p.stats.ftAttempts, 0)
    },
    players: players.map(player => ({
      ...player,
      calculatedStats: {
        fgPercentage: calculateFGPercentage(player.stats.fgMade, player.stats.fgAttempts),
        ftPercentage: calculateFTPercentage(player.stats.ftMade, player.stats.ftAttempts),
        totalRebounds: calculateTotalRebounds(player.stats.offRebounds, player.stats.defRebounds),
        formattedTime: formatTime(player.stats.timeOnCourt)
      }
    })),
    exportInfo: {
      exportedAt: new Date().toISOString(),
      exportedBy: 'Basketball Review App',
      version: '1.0'
    }
  };

  // Convert to JSON string
  const jsonContent = JSON.stringify(exportData, null, 2);

  // Create and download file
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${gameInfo.teamName}_vs_${gameInfo.opponentName}_${new Date().toISOString().split('T')[0]}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const generateGameSummary = (
  teamName: string,
  opponentName: string,
  teamScore: number,
  opponentScore: number,
  players: Player[],
  gameDate?: Date,
  totalDuration?: number
): GameSummary => {
  return {
    gameInfo: {
      teamName,
      opponentName,
      finalScore: `${teamScore} - ${opponentScore}`,
      gameDate: gameDate ? gameDate.toLocaleDateString() : new Date().toLocaleDateString(),
      totalDuration: totalDuration ? formatTime(totalDuration) : 'N/A'
    },
    players
  };
};