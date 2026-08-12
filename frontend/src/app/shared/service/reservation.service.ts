import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Reservation } from '../../models/interface/reservation.interface';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CreateReservationRequest, ReservationDto } from '../../models/api/reservation.models';
import { LoadState } from '../../models/load-state';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private http = inject(HttpClient);
  private readonly BASE_URL = `${environment.apiUrl}/reservations`;

  private _reservations = signal<Reservation[]>([]);
  public reservations = this._reservations.asReadonly();
  private _state = signal<LoadState>('idle');
  public state = this._state.asReadonly();

  /**
   * Carica tutte le prenotazioni dal server e aggiorna il segnale interno.
   * @returns Un Observable con l'elenco delle prenotazioni.
   */
  loadReservations() {
    this._state.set('loading');
    return this.http.get<ReservationDto[]>(this.BASE_URL).pipe(
      tap({
        next: data => {
          const reservations = data.map(item => this.toReservation(item));
          this._reservations.set(reservations);
          this._state.set(reservations.length ? 'success' : 'empty');
        },
        error: () => {
          this._reservations.set([]);
          this._state.set('error');
        }
      })
    );
  }

  /**
   * Aggiunge una nuova prenotazione per una partita.
   * @param reservation L'oggetto prenotazione con i dati del giocatore.
   * @returns Un Observable con la prenotazione confermata dal server.
   */
  addReservation(request: CreateReservationRequest) {
    return this.http.post<ReservationDto>(this.BASE_URL, request).pipe(
      tap(dto => {
        const newReservation = this.toReservation(dto);
        this._reservations.update(prev => [...prev, newReservation]);
        this._state.set('success');
      })
    );
  }

  /**
   * Elimina una prenotazione esistente tramite l'ID del giocatore.
   * @param id L'identificativo del giocatore la cui prenotazione deve essere rimossa.
   * @returns Un Observable di tipo void.
   */
  deleteReservation(id: number) {
    return this.http.delete<void>(`${this.BASE_URL}/${id}`).pipe(
      tap(() => {
        this._reservations.update(prev => prev.filter(reservation => reservation.id !== id));
        this._state.set(this._reservations().length ? 'success' : 'empty');
      })
    );
  }

  /**
   * Popola automaticamente le prenotazioni fittizie (10 giocatori).
   */
  seedDummyReservations() {
    return this.http.post<ReservationDto[]>(`${this.BASE_URL}/seed-dummy`, {}).pipe(
      tap(data => {
        const reservations = data.map(item => this.toReservation(item));
        this._reservations.set(reservations);
        this._state.set(reservations.length ? 'success' : 'empty');
      })
    );
  }

  clear(): void {
    this._reservations.set([]);
    this._state.set('idle');
  }

  private toReservation(dto: ReservationDto): Reservation {
    return {
      ...dto,
      dataOra: new Date(dto.dataOra)
    };
  }
}
