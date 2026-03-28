import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Player } from '../../models/interface/match.interface';
import { PlayerStats } from '../../models/interface/player-stats.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  private http = inject(HttpClient);
  private readonly BASE_URL = `${environment.apiUrl}/players`;

  /**
   * Recupera l'elenco completo di tutti i giocatori registrati.
   * @returns Un Observable con l'array degli oggetti Player.
   */
  getPlayers() {
    return this.http.get<Player[]>(this.BASE_URL);
  }

  /**
   * Recupera i dettagli di un singolo giocatore tramite il suo ID.
   * @param id L'identificativo unico del giocatore.
   * @returns Un Observable con l'oggetto Player corrispondente.
   */
  getPlayerById(id: number) {
    return this.http.get<Player>(`${this.BASE_URL}/${id}`);
  }

  /**
   * Recupera le statistiche di performance di un giocatore specifico.
   * @param id L'identificativo del giocatore.
   * @param season Opzionale: filtra le statistiche per una specifica stagione.
   * @returns Un Observable con l'elenco delle statistiche (Gol, Assist, etc.) per il giocatore.
   */
  getPlayerStats(id: number, season?: string) {
    const url = season ? `${this.BASE_URL}/${id}/stats/${season}` : `${this.BASE_URL}/${id}/stats`;
    return this.http.get<PlayerStats[]>(url);
  }
}
