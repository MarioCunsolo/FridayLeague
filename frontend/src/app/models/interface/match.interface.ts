import { MatchStatus, MatchStatusId, StatoPartitaLookup } from '../enum/match-status.enum';

export { MatchStatus, MatchStatusId, StatoPartitaLookup };

export interface Player {
  name: string;
  goals: number;
  assists: number;
}

export interface GoalEvent {
  scorerName: string;
  isHome: boolean;
  assistName?: string;
}

export interface Match {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: MatchStatus;
  statoId?: MatchStatusId;
  date: Date;
  homePlayers?: Player[];
  awayPlayers?: Player[];
  goalTimeline?: GoalEvent[];
}
