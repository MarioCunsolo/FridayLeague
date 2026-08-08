import { Component, computed, inject, TemplateRef, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-reservation',
  templateUrl: './reservation.component.html',
  styleUrls: ['./reservation.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ReactiveFormsModule,
    NzButtonModule,
    NzIconModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzAutocompleteModule
  ]
})
export class ReservationComponent implements OnInit {
  private modal = inject(NzModalService);
  private fb = inject(FormBuilder);
  private message = inject(NzMessageService);
  private reservationService = inject(ReservationService);
  private legaService = inject(LegaService);
  private authService = inject(AuthService);

  validateForm = this.fb.group({
    nomeCognome: ['', [Validators.required]]
  });

  // Elenco dei membri della lega attiva, usato per l'autocomplete "Prenota altra persona"
  registeredUsers: { id: number, nomeCognome: string }[] = [];
  filteredOptions: { id: number, nomeCognome: string }[] = [];

  reservations = this.reservationService.reservations;

  starters = computed(() => this.reservations().slice(0, 14));
  substitutes = computed(() => this.reservations().slice(14));

  ngOnInit(): void {
    this.reservationService.loadReservations().subscribe();

    const legaId = this.authService.currentUser()?.legaId;
    if (legaId) {
      this.legaService.getLegaPartecipanti(legaId).subscribe((partecipanti: any[]) => {
        this.registeredUsers = partecipanti.map(p => ({ id: p.userId, nomeCognome: `${p.nome} ${p.cognome}` }));
      });
    }
  }

  prenotaMe(): void {
    const user = this.authService.currentUser();
    if (!user) return;

    this.reservationService.addReservation({ nomeCognome: `${user.nome} ${user.cognome}`, dataOra: new Date() }).subscribe({
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

  deleteReservation(player: Reservation): void {
    if (!player.playerId) {
      this.message.error('Non è possibile eliminare una prenotazione non collegata a un utente registrato.');
      return;
    }

    this.modal.confirm({
      nzTitle: 'Sei sicuro di voler eliminare questa prenotazione?',
      nzContent: `<b style="color: #ff4d4f;">L'operazione è irreversibile.</b><br>Perderai la tua posizione attuale nella lista (Titolare/Sostituto).`,
      nzOkText: 'Sì, elimina',
      nzOkDanger: true,
      nzOnOk: () => {
        this.reservationService.deleteReservation(player.playerId!).subscribe({
          error: (err) => this.message.error(err.error || "Errore durante l'eliminazione della prenotazione.")
        });
      },
      nzCancelText: 'Annulla'
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


  openAddOthersModal(tpl: TemplateRef<unknown>): void {
    this.validateForm.reset();
    this.filteredOptions = this.registeredUsers;

    const modalRef = this.modal.create({
      nzTitle: 'Prenota altra persona',
      nzContent: tpl,
      nzWidth: 500,
      nzOkDisabled: true,
      nzOnOk: () => {
        if (this.validateForm.valid) {
          const typedName = this.validateForm.value.nomeCognome as string;

          this.reservationService.addReservation({ nomeCognome: typedName, dataOra: new Date() }).subscribe({
            next: () => this.message.success('Prenotazione effettuata con successo!'),
            error: (err) => this.message.error(err.error || 'Errore durante la prenotazione.')
          });
          return true;
        } else {
          return false;
        }
      }
    });

    this.validateForm.get('nomeCognome')?.valueChanges.subscribe((value: string | null) => {
      this.filteredOptions = this.registeredUsers.filter(option =>
        option.nomeCognome.toLowerCase().includes((value || '').toLowerCase())
      );
    });

    this.validateForm.statusChanges.subscribe(() => {
      modalRef.updateConfig({
        nzOkDisabled: !this.validateForm.valid
      });
    });
  }

}
