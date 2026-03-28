import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Reservation } from '../../models/interface/reservation.interface';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private http = inject(HttpClient);
  private readonly BASE_URL = `${environment.apiUrl}/reservations`;

  private _reservations = signal<Reservation[]>([]);
  public reservations = this._reservations.asReadonly();

  /**
   * Carica tutte le prenotazioni dal server e aggiorna il segnale interno.
   * @returns Un Observable con l'elenco delle prenotazioni.
   */
  loadReservations() {
    return this.http.get<Reservation[]>(this.BASE_URL).pipe(
      tap(data => this._reservations.set(data))
    );
  }

  /**
   * Aggiunge una nuova prenotazione per una partita.
   * @param reservation L'oggetto prenotazione con i dati del giocatore.
   * @returns Un Observable con la prenotazione confermata dal server.
   */
  addReservation(reservation: Reservation) {
    return this.http.post<Reservation>(this.BASE_URL, reservation).pipe(
      tap(newRes => this._reservations.update(prev => [...prev, newRes]))
    );
  }

  /**
   * Elimina una prenotazione esistente tramite l'ID del giocatore.
   * @param id L'identificativo del giocatore la cui prenotazione deve essere rimossa.
   * @returns Un Observable di tipo void.
   */
  deleteReservation(id: number) {
    return this.http.delete<void>(`${this.BASE_URL}/${id}`).pipe(
      tap(() => this._reservations.update(prev => prev.filter(r => r.playerId !== id)))
    );
  }
}
