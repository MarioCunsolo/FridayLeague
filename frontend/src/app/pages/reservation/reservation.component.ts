import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Reservation } from '../../models/interface/reservation.interface';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ReservationService } from '../../shared/service/reservation.service';
import { LegaService } from '../../shared/service/lega.service';
import { AuthService } from '../../shared/service/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ParticipantDto } from '../../models/api/league.models';
import { AuthorizationService } from '../../shared/service/authorization.service';
import { environment } from '../../../environments/environment';
import { ResponsiveOverlayService } from '../../shared/overlay/responsive-overlay.service';
import {
  ReservationFormComponent,
  ReservationFormDialogData,
  ReservationFormResult
} from './components/reservation-form/reservation-form.component';
import {
  ConfirmActionComponent,
  ConfirmActionData
} from '../../shared/overlay/content/confirm-action/confirm-action.component';

@Component({
  selector: 'app-reservation',
  templateUrl: './reservation.component.html',
  styleUrls: ['./reservation.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DatePipe,
    NzButtonModule,
    NzIconModule
  ]
})
export class ReservationComponent implements OnInit {
  private message = inject(NzMessageService);
  private reservationService = inject(ReservationService);
  private legaService = inject(LegaService);
  private authService = inject(AuthService);
  private authorization = inject(AuthorizationService);
  private destroyRef = inject(DestroyRef);
  private overlays = inject(ResponsiveOverlayService);

  // Elenco dei membri della lega attiva, usato per l'autocomplete "Prenota altra persona"
  registeredUsers: { id: string, nomeCognome: string }[] = [];

  reservations = this.reservationService.reservations;
  readonly isDevelopment = !environment.production;

  readonly starterLimit = computed(() => {
    const user = this.authService.currentUser();
    const activeLeague = user?.leghe.find(league => league.id === user.legaId);
    return (activeLeague?.dimensioneSquadra ?? 7) * 2;
  });
  starters = computed(() => this.reservations().slice(0, this.starterLimit()));
  substitutes = computed(() => this.reservations().slice(this.starterLimit()));

  ngOnInit(): void {
    this.reservationService.loadReservations().subscribe();

    const legaId = this.authService.currentUser()?.legaId;
    if (legaId) {
      this.legaService.getLegaPartecipanti(legaId).subscribe((partecipanti: ParticipantDto[]) => {
        this.registeredUsers = partecipanti.map(p => ({ id: p.userId, nomeCognome: `${p.nome} ${p.cognome}` }));
      });
    }
  }

  prenotaMe(): void {
    const user = this.authService.currentUser();
    if (!user) return;

    this.reservationService.addReservation({ nomeCognome: `${user.nome} ${user.cognome}` }).subscribe({
      next: () => this.message.success('Prenotazione effettuata con successo!'),
      error: (err) => this.message.error(err.error || 'Errore durante la prenotazione.')
    });
  }

  popolaFittizie(): void {
    this.reservationService.seedDummyReservations().subscribe({
      next: () => this.message.success('10 prenotazioni fittizie generate con successo!'),
      error: (err) => this.message.error(err.error || 'Errore durante la generazione delle prenotazioni fittizie.')
    });
  }

  canDeleteReservation(player: Reservation): boolean {
    return this.authorization.canDeleteReservation(this.authService.currentUser(), player);
  }

  deleteReservation(player: Reservation): void {
    if (!this.canDeleteReservation(player)) {
      this.message.error('Non hai i permessi per eliminare questa prenotazione.');
      return;
    }

    this.overlays.open<ConfirmActionData, true>(ConfirmActionComponent, {
      title: 'Elimina prenotazione',
      data: {
        message: "Sei sicuro di voler eliminare questa prenotazione? L'operazione è irreversibile e perderai la tua posizione attuale nella lista.",
        confirmText: 'Sì, elimina',
        danger: true
      },
      modal: { width: 416 },
      drawer: { height: 'auto' }
    }).afterClosed$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(confirmed => {
        if (!confirmed) return;

        this.reservationService.deleteReservation(player.id).subscribe({
          next: () => this.message.success('Prenotazione eliminata con successo.'),
          error: err => this.message.error(err.error || "Errore durante l'eliminazione della prenotazione.")
        });
      });
  }

  isReservationDisabled = computed(() => {
    // Nota: in un'app reale useremmo un segnale temporale per reattività reale al passare del tempo
    const now = new Date();
    const day = now.getDay(); // 0 is Sunday, 6 is Saturday
    const hours = now.getHours();

    // Disable from Saturday (entire day) until Sunday at 17:00
    if (day === 6) {
      return true;
    } else if (day === 0 && hours < 17) {
      return true;
    }

    return false;
  });


  openAddOthersModal(): void {
    this.overlays.open<ReservationFormDialogData, ReservationFormResult>(ReservationFormComponent, {
      title: 'Prenota altra persona',
      data: { availablePeople: this.getAvailableRegisteredUsers() },
      autofocus: null,
      modal: { width: 500 },
      drawer: { height: 'auto' }
    }).afterClosed$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (!result) return;

        this.reservationService.addReservation(result).subscribe({
          next: () => this.message.success('Prenotazione effettuata con successo!'),
          error: err => this.message.error(err.error || 'Errore durante la prenotazione.')
        });
      });
  }

  private getAvailableRegisteredUsers(): { id: string, nomeCognome: string }[] {
    const reservedUserIds = new Set(
      this.reservations()
        .map(reservation => reservation.playerId)
        .filter((playerId): playerId is string => playerId !== null)
    );
    const reservedNames = new Set(
      this.reservations().map(reservation => this.normalizeName(reservation.nomeCognome))
    );
    return this.registeredUsers.filter(option =>
      !reservedUserIds.has(option.id) &&
      !reservedNames.has(this.normalizeName(option.nomeCognome))
    );
  }

  private normalizeName(name: string | null): string {
    return (name ?? '').trim().toLocaleLowerCase();
  }

}
