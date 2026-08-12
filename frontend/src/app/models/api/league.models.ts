import { ActivityAction, LeagueRole, Uuid } from './core.models';

export interface ParticipantDto {
  userId: Uuid;
  nome: string;
  cognome: string;
  email: string;
  ruolo: LeagueRole;
}

export interface ActivityLogDto {
  id: number;
  esecutoreId: Uuid;
  esecutoreNome: string;
  esecutoreRuolo: LeagueRole;
  azione: ActivityAction;
  targetUserId: Uuid | null;
  targetUserNome: string;
  dettagli: string;
  timestamp: string;
}
