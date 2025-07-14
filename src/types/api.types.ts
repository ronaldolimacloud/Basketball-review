// API Response Types

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    statusCode?: number;
    details?: any;
  };
  message?: string;
}

// Auth Types
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthData {
  user: User;
  token: string;
}

// Player Types
export interface Player {
  id: string;
  coachId: string;
  name: string;
  position?: string;
  height?: string;
  weight?: string;
  jerseyNumber?: number;
  profileImageUrl?: string;
  isActive: boolean;
  totalGamesPlayed: number;
  careerPoints: number;
  careerAssists: number;
  careerRebounds: number;
  careerSteals: number;
  careerBlocks: number;
  careerFouls: number;
  careerTurnovers: number;
  careerFgMade: number;
  careerFgAttempts: number;
  careerFtMade: number;
  careerFtAttempts: number;
  careerMinutesPlayed: number;
  createdAt: string;
  updatedAt: string;
}

// Team Types
export interface Team {
  id: string;
  coachId: string;
  name: string;
  description?: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  players?: TeamPlayer[];
}

export interface TeamPlayer {
  id: string;
  teamId: string;
  playerId: string;
  coachId: string;
  isActive: boolean;
  dateJoined: string;
  createdAt: string;
  updatedAt: string;
}

// Game Types
export interface Game {
  id: string;
  coachId: string;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId?: string;
  awayTeamName: string;
  gameFormat: 'quarters' | 'halves';
  gameDate: string;
  homeTeamScore: number;
  awayTeamScore: number;
  totalDuration: number;
  isCompleted: boolean;
  notes?: string;
  periodScores: any[];
  createdAt: string;
  updatedAt: string;
}

// Stats Types
export interface GameStat {
  id: string;
  coachId: string;
  gameId: string;
  playerId: string;
  points: number;
  assists: number;
  offRebounds: number;
  defRebounds: number;
  steals: number;
  blocks: number;
  fouls: number;
  turnovers: number;
  fgMade: number;
  fgAttempts: number;
  ftMade: number;
  ftAttempts: number;
  minutesPlayed: number;
  plusMinus: number;
  startedOnCourt: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GameEvent {
  id: string;
  coachId: string;
  gameId: string;
  playerId?: string;
  timestamp: string;
  gameTime?: number;
  period: number;
  periodTime: string;
  eventType: 'SCORE' | 'FOUL' | 'ASSIST' | 'REBOUND' | 'STEAL' | 'BLOCK' | 'TURNOVER' | 'SUBSTITUTION' | 'TIMEOUT' | 'PERIOD_END';
  eventDetail?: string;
  points?: number;
  teamId?: string;
  isHomeTeam?: boolean;
  homeTeamScore?: number;
  awayTeamScore?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Upload Types
export interface UploadResponse {
  imageUrl?: string;
  logoUrl?: string;
  filename: string;
  size: number;
  mimetype: string;
}