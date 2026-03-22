import { Component, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Reservation } from '../../models/interface/reservation.interface';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { inject } from '@angular/core';

@Component({
  selector: 'app-reservation',
  templateUrl: './reservation.component.html',
  styleUrls: ['./reservation.component.css'],
  standalone: true,
  imports: [DatePipe, NzButtonModule, NzIconModule, NzModalModule]
})
export class ReservationComponent {
  private modal = inject(NzModalService);

  // Dati di esempio per le prenotazioni come Signal
  reservations = signal<Reservation[]>([
    { nomeCognome: 'Mario Rossi', dataOra: new Date('2026-03-25T17:00:15') },
    { nomeCognome: 'Luigi Bianchi', dataOra: new Date('2026-03-25T17:05:42') },
    { nomeCognome: 'Giuseppe Verdi', dataOra: new Date('2026-03-25T17:08:05') },
    { nomeCognome: 'Francesco Neri', dataOra: new Date('2026-03-25T17:10:22') },
    { nomeCognome: 'Andrea Gialli', dataOra: new Date('2026-03-25T17:12:58') },
    { nomeCognome: 'Simone Nipotini', dataOra: new Date('2026-03-25T17:15:11') },
    { nomeCognome: 'Carlo Magno', dataOra: new Date('2026-03-25T17:18:34') },
    { nomeCognome: 'Luca Romano', dataOra: new Date('2026-03-25T17:20:15') },
    { nomeCognome: 'Paolo Rossi', dataOra: new Date('2026-03-25T17:22:42') },
    { nomeCognome: 'Giorgio Neri', dataOra: new Date('2026-03-25T17:25:05') },
    { nomeCognome: 'Marco Polo', dataOra: new Date('2026-03-25T17:28:22') },
    { nomeCognome: 'Roberto Bossi', dataOra: new Date('2026-03-25T17:30:58') },
    { nomeCognome: 'Federico Fellini', dataOra: new Date('2026-03-25T17:32:11') },
    { nomeCognome: 'Dante Alighieri', dataOra: new Date('2026-03-25T17:35:34') },
    { nomeCognome: 'Sostituto 1', dataOra: new Date('2026-03-25T17:40:15') },
    { nomeCognome: 'Sostituto 2', dataOra: new Date('2026-03-25T17:42:42') },
    { nomeCognome: 'Sostituto 3', dataOra: new Date('2026-03-25T17:45:05') },
  ]);

  starters = computed(() => this.reservations().slice(0, 14));
  substitutes = computed(() => this.reservations().slice(14));

  deleteReservation(player: Reservation): void {
    this.modal.confirm({
      nzTitle: 'Sei sicuro di voler eliminare questa prenotazione?',
      nzContent: `<b style="color: #ff4d4f;">L'operazione è irreversibile.</b><br>Perderai la tua posizione attuale nella lista (Titolare/Sostituto).`,
      nzOkText: 'Sì, elimina',
      nzOkDanger: true,
      nzOnOk: () => {
        this.reservations.update(res => res.filter(r => r !== player));
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

}
