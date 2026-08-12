import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ActivityLogDto, ParticipantDto } from '../../models/api/league.models';
import { CreateLeagueRequest, JoinLeagueRequest, UserDto } from '../../models/api/auth.models';
import { LeagueRole, Uuid } from '../../models/api/core.models';
import { AuthService } from './auth.service';
import { MatchService } from './match.service';
import { ReservationService } from './reservation.service';

@Injectable({ providedIn: 'root' })
export class LegaService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly matchService = inject(MatchService);
  private readonly reservationService = inject(ReservationService);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  creaLega(request: CreateLeagueRequest) {
    return this.http.post<UserDto>(`${this.baseUrl}/crea-lega`, request).pipe(tap(user => this.authService.updateCurrentUser(user)));
  }

  partecipaLega(request: JoinLeagueRequest) {
    return this.http.post<UserDto>(`${this.baseUrl}/partecipa-lega`, request).pipe(tap(user => this.authService.updateCurrentUser(user)));
  }

  cambiaLega(idLega: Uuid) {
    return this.http.post<UserDto>(`${this.baseUrl}/cambia-lega`, { idLega }).pipe(
      tap(user => {
        this.matchService.clear();
        this.reservationService.clear();
        this.authService.updateCurrentUser(user);
      })
    );
  }

  getLegaPartecipanti(legaId: Uuid) {
    return this.http.get<ParticipantDto[]>(`${this.baseUrl}/lega/${legaId}/partecipanti`);
  }

  cambiaRuoloPartecipante(legaId: Uuid, targetUserId: Uuid, nuovoRuolo: LeagueRole) {
    return this.http.post<void>(`${this.baseUrl}/lega/cambia-ruolo-partecipante`, { legaId, targetUserId, nuovoRuolo });
  }

  rimuoviPartecipante(legaId: Uuid, targetUserId: Uuid) {
    return this.http.post<void>(`${this.baseUrl}/lega/rimuovi-partecipante`, { legaId, targetUserId });
  }

  getRegistroAttivita(legaId: Uuid) {
    return this.http.get<ActivityLogDto[]>(`${this.baseUrl}/lega/${legaId}/registri-attivita`);
  }
}
