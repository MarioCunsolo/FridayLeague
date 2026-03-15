import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';

@Component({
    selector: 'app-reservation',
    templateUrl: './reservation.component.html',
    styleUrls: ['./reservation.component.css'],
    imports: [RouterLink, DatePipe]
})
export class ReservationComponent {

  // Dati di esempio per le prenotazioni come Signal
  reservations = signal([
    { nomeCognome: 'Mario Rossi', dataOra: new Date('2026-03-25T17:00:00') },
    { nomeCognome: 'Luigi Bianchi', dataOra: new Date('2026-03-26T18:30:00') },
    { nomeCognome: 'Giuseppe Verdi', dataOra: new Date('2026-03-27T19:00:00') },
    { nomeCognome: 'Francesco Neri', dataOra: new Date('2026-03-28T20:30:00') },
    { nomeCognome: 'Andrea Gialli', dataOra: new Date('2026-03-29T21:00:00') },
    { nomeCognome: 'Simone Nipotini', dataOra: new Date('2026-03-30T10:00:00') },
    { nomeCognome: 'Carlo Magno', dataOra: new Date('2026-03-31T15:30:00') },
  ]);

  deleteReservation(index: number): void {
    this.reservations.update(res => {
      const newRes = [...res];
      newRes.splice(index, 1);
      return newRes;
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
