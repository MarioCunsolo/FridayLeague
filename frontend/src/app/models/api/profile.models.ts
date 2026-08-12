import { UserStats } from '../interface/user-stats.interface';

export interface PlayerProfileSummary {
  goals: number;
  assists: number;
  motm: number;
  matchesPlayed: number;
  totalLeagueMatches: number;
  goalRank: number;
  assistRank: number;
  motmRank: number;
  goalsPerMatch: number;
  assistsPerMatch: number;
  participationRate: number;
  leagueAverageGoals: number;
  leagueAverageAssists: number;
}

export interface PlayerMatchSummary {
  id: number;
  date: Date;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  playerTeam: string;
  goals: number;
  assists: number;
  isMotm: boolean;
}

export interface PlayerPerformancePoint {
  matchId: number;
  date: Date;
  goals: number;
  assists: number;
}

export interface NextMatchReservation {
  id: number;
  date: Date;
  homeTeam: string;
  awayTeam: string;
  isReserved: boolean;
}

export interface PlayerProfile {
  season: string;
  summary: PlayerProfileSummary;
  stats: UserStats[];
  recentMatches: PlayerMatchSummary[];
  performance: PlayerPerformancePoint[];
  nextMatch: NextMatchReservation | null;
}

interface PlayerMatchSummaryResponse extends Omit<PlayerMatchSummary, 'date'> {
  date: string;
}

interface PlayerPerformancePointResponse extends Omit<PlayerPerformancePoint, 'date'> {
  date: string;
}

interface NextMatchReservationResponse extends Omit<NextMatchReservation, 'date'> {
  date: string;
}

export interface PlayerProfileResponse extends Omit<PlayerProfile, 'recentMatches' | 'performance' | 'nextMatch'> {
  recentMatches: PlayerMatchSummaryResponse[];
  performance: PlayerPerformancePointResponse[];
  nextMatch: NextMatchReservationResponse | null;
}
