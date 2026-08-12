import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PlayerProfile as PlayerListItem } from '../../models/interface/player.interface';
import { UserStats } from '../../models/interface/user-stats.interface';
import { PlayerProfile as DetailedPlayerProfile, PlayerProfileResponse } from '../../models/api/profile.models';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs';

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
    return this.http.get<PlayerListItem[]>(this.BASE_URL);
  }

  /**
   * Recupera i dettagli di un singolo giocatore tramite il suo ID.
   * @param id L'identificativo unico del giocatore.
   * @returns Un Observable con l'oggetto giocatore corrispondente.
   */
  getPlayerById(id: string) {
    return this.http.get<PlayerListItem>(`${this.BASE_URL}/${id}`);
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

  /** Restituisce tutti i dati necessari alla pagina profilo con una singola richiesta. */
  getPlayerProfile(id: string, season?: string) {
    const url = season ? `${this.BASE_URL}/${id}/profile/${season}` : `${this.BASE_URL}/${id}/profile`;
    return this.http.get<PlayerProfileResponse>(url).pipe(
      map(profile => this.toPlayerProfile(profile))
    );
  }

  private toPlayerProfile(profile: PlayerProfileResponse): DetailedPlayerProfile {
    return {
      ...profile,
      recentMatches: profile.recentMatches.map(match => ({ ...match, date: new Date(match.date) })),
      performance: profile.performance.map(point => ({ ...point, date: new Date(point.date) })),
      nextMatch: profile.nextMatch ? { ...profile.nextMatch, date: new Date(profile.nextMatch.date) } : null
    };
  }
}
