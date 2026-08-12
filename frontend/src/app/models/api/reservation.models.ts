import { Uuid } from './core.models';

/** Contratto JSON esposto dall'API. */
export interface ReservationDto {
  id: number;
  nomeCognome: string;
  dataOra: string;
  playerId: Uuid | null;
  prenotatoDaUserId: Uuid;
}

/** Il server valorizza data e utente che effettua la prenotazione. */
export interface CreateReservationRequest {
  nomeCognome: string;
}
