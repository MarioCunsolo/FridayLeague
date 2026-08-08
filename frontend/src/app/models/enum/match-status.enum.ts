export enum MatchStatusId {
  PROGRAMMATA = 1,
  IN_CORSO = 2,
  CONCLUSA = 3,
  ANNULLATA = 4
}

export enum MatchStatus {
  PROGRAMMATA = 'Programmata',
  IN_CORSO = 'In Corso',
  CONCLUSA = 'Conclusa',
  ANNULLATA = 'Annullata'
}

export interface StatoPartitaLookup {
  id: number;
  codice: string;
  nome: string;
}

export const MATCH_STATUS_MAP: Record<number, MatchStatus> = {
  [MatchStatusId.PROGRAMMATA]: MatchStatus.PROGRAMMATA,
  [MatchStatusId.IN_CORSO]: MatchStatus.IN_CORSO,
  [MatchStatusId.CONCLUSA]: MatchStatus.CONCLUSA,
  [MatchStatusId.ANNULLATA]: MatchStatus.ANNULLATA
};
