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

export type MatchStatus = 'Programmata' | 'Terminata' | 'In Corso';

export interface Match {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: MatchStatus;
  date: Date;
  homePlayers?: Player[];
  awayPlayers?: Player[];
  goalTimeline?: GoalEvent[];
}
