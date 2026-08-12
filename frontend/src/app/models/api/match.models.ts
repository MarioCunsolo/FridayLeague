import { MatchStatus } from '../enum/match-status.enum';

export interface MatchPlayerDto {
  name: string;
  goals: number;
  assists: number;
}

export interface GoalEventDto {
  scorerName: string;
  isHome: boolean;
  assistName?: string | null;
}

export interface MatchDto {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
  date: string;
  homePlayers: MatchPlayerDto[];
  awayPlayers: MatchPlayerDto[];
  goalTimeline: GoalEventDto[];
}

export interface CreateMatchRequest {
  homeTeam: string;
  awayTeam: string;
  date: Date;
  status?: MatchStatus;
}

/** Campi modificabili dalla modale di creazione/modifica partita. */
export interface MatchFormData {
  homeTeam: string;
  awayTeam: string;
  date: Date;
}
