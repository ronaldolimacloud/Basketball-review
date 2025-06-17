export interface PlayerStats {
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
}

export interface Player {
  id: number;
  name: string;
  onCourt: boolean;
  profileImageUrl?: string;
  stats: PlayerStats;
  startTime: number | null;
}

export interface PeriodScore {
  period: number;
  periodLabel: string;
  teamScore: number;
  opponentScore: number;
  totalTeamScore: number;
  totalOpponentScore: number;
}

export type GameFormat = 'quarters' | 'halves';

export type StatType = keyof PlayerStats | 'fgMissed' | 'ftMissed'; 