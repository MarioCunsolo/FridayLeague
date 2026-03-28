import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PlayerStats } from '../../models/interface/player-stats.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private http = inject(HttpClient);
  private readonly BASE_URL = `${environment.apiUrl}/stats`;

  /**
   * Recupera la classifica dei marcatori (Gol).
   * @param season Opzionale: specifica l'anno della stagione da filtrare.
   * @returns Un Observable con l'array degli stati dei giocatori (Nome, Team, Valore Gol, etc.).
   */
  getScorers(season?: string) {
    const url = season ? `${this.BASE_URL}/scorers/${season}` : `${this.BASE_URL}/scorers`;
    return this.http.get<PlayerStats[]>(url);
  }

  /**
   * Recupera la classifica degli assistman.
   * @param season Opzionale: specifica l'anno della stagione da filtrare.
   * @returns Un Observable con l'array degli stati dei giocatori relativi agli assist.
   */
  getAssists(season?: string) {
    const url = season ? `${this.BASE_URL}/assists/${season}` : `${this.BASE_URL}/assists`;
    return this.http.get<PlayerStats[]>(url);
  }

  /**
   * Recupera la classifica dei Man of the Match (MOTM).
   * @param season Opzionale: specifica l'anno della stagione da filtrare.
   * @returns Un Observable con l'array dei premi MOTM vinti dai giocatori.
   */
  getMOTM(season?: string) {
    const url = season ? `${this.BASE_URL}/motm/${season}` : `${this.BASE_URL}/motm`;
    return this.http.get<PlayerStats[]>(url);
  }
}
