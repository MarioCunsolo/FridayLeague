import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PlayerProfile } from '../../models/interface/player.interface';
import { UserStats } from '../../models/interface/user-stats.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  private http = inject(HttpClient);
  private readonly BASE_URL = `${environment.apiUrl}/players`;

  /**
   * Recupera l'elenco dei giocatori della lega attiva, con i relativi totali di gol/assist.
   * @returns Un Observable con l'array dei giocatori.
   */
  getPlayers() {
    return this.http.get<PlayerProfile[]>(this.BASE_URL);
  }

  /**
   * Recupera i dettagli di un singolo giocatore tramite il suo ID.
   * @param id L'identificativo unico del giocatore.
   * @returns Un Observable con l'oggetto giocatore corrispondente.
   */
  getPlayerById(id: string) {
    return this.http.get<PlayerProfile>(`${this.BASE_URL}/${id}`);
  }

  /**
   * Recupera le statistiche (Gol, Assist, MOTM, Partite) di un giocatore specifico.
   * @param id L'identificativo del giocatore.
   * @param season Opzionale: filtra le statistiche per una specifica stagione.
   * @returns Un Observable con le statistiche del giocatore, con relativo posizionamento in classifica.
   */
  getPlayerStats(id: string, season?: string) {
    const url = season ? `${this.BASE_URL}/${id}/stats/${season}` : `${this.BASE_URL}/${id}/stats`;
    return this.http.get<UserStats[]>(url);
  }
}
