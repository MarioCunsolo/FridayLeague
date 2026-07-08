import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class LegaService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private readonly BASE_URL = `${environment.apiUrl}/auth`;

  /**
   * Crea una nuova lega nel backend.
   */
  creaLega(nomeLega: string, descrizione?: string) {
    return this.http.post<any>(`${this.BASE_URL}/crea-lega`, { nomeLega, descrizione }).pipe(
      tap(user => {
        this.authService.updateCurrentUser(user);
      })
    );
  }

  /**
   * Partecipa ad una lega esistente tramite codice.
   */
  partecipaLega(codiceLega: string) {
    return this.http.post<any>(`${this.BASE_URL}/partecipa-lega`, { codiceLega }).pipe(
      tap(user => {
        this.authService.updateCurrentUser(user);
      })
    );
  }

  /**
   * Cambia la lega attualmente attiva.
   */
  cambiaLega(idLega: number) {
    this.http.post<any>(`${this.BASE_URL}/cambia-lega`, { idLega }).subscribe({
      next: user => {
        this.authService.updateCurrentUser(user);
      },
      error: err => {
        console.error('Errore durante il cambio della lega', err);
      }
    });
  }

  /**
   * Recupera la lista dei partecipanti di una lega.
   */
  getLegaPartecipanti(legaId: number) {
    return this.http.get<any[]>(`${this.BASE_URL}/lega/${legaId}/partecipanti`);
  }

  /**
   * Modifica il ruolo di un partecipante.
   */
  cambiaRuoloPartecipante(legaId: number, targetUserId: number, nuovoRuolo: string) {
    return this.http.post<void>(`${this.BASE_URL}/lega/cambia-ruolo-partecipante`, {
      legaId,
      targetUserId,
      nuovoRuolo
    });
  }

  /**
   * Rimuove un partecipante dalla lega.
   */
  rimuoviPartecipante(legaId: number, targetUserId: number) {
    return this.http.post<void>(`${this.BASE_URL}/lega/rimuovi-partecipante`, {
      legaId,
      targetUserId
    });
  }
}
