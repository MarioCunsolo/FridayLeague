import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal, TemplateRef, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Reservation } from '../../models/interface/reservation.interface';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ReservationService } from '../../shared/service/reservation.service';
import { LegaService } from '../../shared/service/lega.service';
import { AuthService } from '../../shared/service/auth.service';
import { ConfirmModalComponent } from '../../shared/component/confirm-modal/confirm-modal.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ParticipantDto } from '../../models/api/league.models';
import { AuthorizationService } from '../../shared/service/authorization.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-reservation',
  templateUrl: './reservation.component.html',
  styleUrls: ['./reservation.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DatePipe,
    ReactiveFormsModule,
    NzButtonModule,
    NzIconModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzAutocompleteModule,
    ConfirmModalComponent
  ]
})
export class ReservationComponent implements OnInit {
  private modal = inject(NzModalService);
  private fb = inject(FormBuilder);
  private message = inject(NzMessageService);
  private reservationService = inject(ReservationService);
  private legaService = inject(LegaService);
  private authService = inject(AuthService);
  private authorization = inject(AuthorizationService);
  private destroyRef = inject(DestroyRef);

  validateForm = this.fb.group({
    nomeCognome: ['', [Validators.required]]
  });

  // Elenco dei membri della lega attiva, usato per l'autocomplete "Prenota altra persona"
  registeredUsers: { id: string, nomeCognome: string }[] = [];
  filteredOptions = signal<{ id: string, nomeCognome: string }[]>([]);

  reservations = this.reservationService.reservations;
  readonly isDevelopment = !environment.production;

  starters = computed(() => this.reservations().slice(0, 14));
  substitutes = computed(() => this.reservations().slice(14));

  constructor() {
    this.validateForm.controls.nomeCognome.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => this.filteredOptions.set(this.registeredUsers.filter(option =>
        option.nomeCognome.toLowerCase().includes((value ?? '').toLowerCase())
      )));
  }

  ngOnInit(): void {
    this.reservationService.loadReservations().subscribe();

    const legaId = this.authService.currentUser()?.legaId;
    if (legaId) {
      this.legaService.getLegaPartecipanti(legaId).subscribe((partecipanti: ParticipantDto[]) => {
        this.registeredUsers = partecipanti.map(p => ({ id: p.userId, nomeCognome: `${p.nome} ${p.cognome}` }));
        this.filteredOptions.set(this.registeredUsers);
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

  isDeleteModalVisible = signal<boolean>(false);
  selectedReservationToDelete = signal<Reservation | null>(null);

  deleteReservation(player: Reservation): void {
    if (!this.canDeleteReservation(player)) {
      this.message.error('Non hai i permessi per eliminare questa prenotazione.');
      return;
    }

    this.selectedReservationToDelete.set(player);
    this.isDeleteModalVisible.set(true);
  }

  confermaEliminazionePrenotazione(): void {
    const player = this.selectedReservationToDelete();
    if (!player) {
      this.isDeleteModalVisible.set(false);
      return;
    }

    this.reservationService.deleteReservation(player.id).subscribe({
      next: () => {
        this.message.success('Prenotazione eliminata con successo.');
        this.isDeleteModalVisible.set(false);
        this.selectedReservationToDelete.set(null);
      },
      error: (err) => {
        this.message.error(err.error || "Errore durante l'eliminazione della prenotazione.");
        this.isDeleteModalVisible.set(false);
      }
    });
  }

  annullaEliminazionePrenotazione(): void {
    this.isDeleteModalVisible.set(false);
    this.selectedReservationToDelete.set(null);
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


  openAddOthersModal(tpl: TemplateRef<unknown>): void {
    this.validateForm.reset();
    this.filteredOptions.set(this.registeredUsers);

    const modalRef = this.modal.create({
      nzTitle: 'Prenota altra persona',
      nzContent: tpl,
      nzWidth: 500,
      nzOkDisabled: true,
      nzOnOk: () => {
        if (this.validateForm.valid) {
          const typedName = this.validateForm.value.nomeCognome as string;

          this.reservationService.addReservation({ nomeCognome: typedName }).subscribe({
            next: () => this.message.success('Prenotazione effettuata con successo!'),
            error: (err) => this.message.error(err.error || 'Errore durante la prenotazione.')
          });
          return true;
        } else {
          return false;
        }
      }
    });

    const statusSubscription = this.validateForm.statusChanges.subscribe(() => {
      modalRef.updateConfig({
        nzOkDisabled: !this.validateForm.valid
      });
    });
    modalRef.afterClose.subscribe(() => statusSubscription.unsubscribe());
  }

}
