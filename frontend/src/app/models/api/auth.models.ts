import { LeagueRole, LeagueTypeCode, Theme, Uuid } from './core.models';

export interface LeagueDto {
  id: Uuid;
  nome: string;
  ruolo: LeagueRole;
  codiceInvito: string;
  descrizione: string | null;
  tipoLegaId: number;
  tipoLegaCodice: LeagueTypeCode;
  tipoLegaNome: string;
  numeroSquadre: number | null;
  numeroGironi: number | null;
}

export interface UserDto {
  id: Uuid;
  nome: string;
  cognome: string;
  email: string;
  legaId: Uuid | null;
  tema: Theme;
  leghe: LeagueDto[];
}

export interface AuthResponse {
  user: UserDto;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember: boolean;
}

export interface RegisterRequest {
  nome: string;
  cognome: string;
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  nome: string;
  cognome: string;
  email: string;
}

export interface CreateLeagueRequest {
  nomeLega: string;
  descrizione?: string;
  tipoLegaId: number;
  numeroSquadre?: number | null;
  numeroGironi?: number | null;
}

export interface JoinLeagueRequest {
  codiceLega: string;
}
