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
  status: string;
  date: Date;
  homePlayers?: Player[];
  awayPlayers?: Player[];
  goalTimeline?: GoalEvent[];
}
