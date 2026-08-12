/** Identificativo UUID serializzato dal backend .NET. */
export type Uuid = string;

export type LeagueRole = 'SUPER_ADMIN' | 'ADMIN' | 'CO_ADMIN' | 'GIOCATORE';
export type Theme = 'dark' | 'light';
export type LeagueTypeCode = 'PARTITA_SINGOLA' | 'CAMPIONATO' | 'TORNEO';
export type ActivityAction = 'CREAZIONE_LEGA' | 'ACCESSO_LEGA' | 'CAMBIO_RUOLO' | 'RIMOZIONE_UTENTE';

export interface ApiError {
  status: number;
  message: string;
  fieldErrors?: Record<string, string[]>;
}
