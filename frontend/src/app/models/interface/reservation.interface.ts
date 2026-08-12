import { Uuid } from '../api/core.models';

export interface Reservation {
  id: number;
  nomeCognome: string;
  dataOra: Date;
  playerId: Uuid | null;
  prenotatoDaUserId?: Uuid | null;
}
