import { Component, input, output, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { Match } from '../../../../models/interface/match.interface';
import { ReservationService } from '../../../service/reservation.service';

@Component({
  selector: 'app-setup-match-modal',
  standalone: true,
  imports: [
    CommonModule,
    NzButtonModule,
    NzIconModule,
    NzTooltipModule
  ],
  templateUrl: './setup-match-modal.component.html',
  styleUrls: ['./setup-match-modal.component.scss']
})
export class SetupMatchModalComponent implements OnInit {
  private reservationService = inject(ReservationService);
  private message = inject(NzMessageService);

  match = input<Match | null>(null);
  submit = output<{ homePlayerNames: string[]; awayPlayerNames: string[] }>();
  cancel = output<void>();

  isConfirmLoading = false;

  homeTeamPlayers = signal<string[]>([]);
  awayTeamPlayers = signal<string[]>([]);
  unassignedPlayers = signal<string[]>([]);

  ngOnInit(): void {
    const currentMatch = this.match();
    const existingHome = (currentMatch?.homePlayers || []).map(p => p.name);
    const existingAway = (currentMatch?.awayPlayers || []).map(p => p.name);

    this.homeTeamPlayers.set(existingHome);
    this.awayTeamPlayers.set(existingAway);

    this.reservationService.loadReservations().subscribe({
      next: (reservations) => {
        const bookedNames = reservations.map(r => r.nomeCognome);
        // Exclude names already assigned to Home or Away
        const unassigned = bookedNames.filter(name =>
          !existingHome.includes(name) && !existingAway.includes(name)
        );
        this.unassignedPlayers.set(unassigned);
      },
      error: () => {
        this.message.error('Errore nel caricamento delle prenotazioni.');
      }
    });
  }

  assignToHome(name: string): void {
    this.unassignedPlayers.update(list => list.filter(n => n !== name));
    this.awayTeamPlayers.update(list => list.filter(n => n !== name));
    if (!this.homeTeamPlayers().includes(name)) {
      this.homeTeamPlayers.update(list => [...list, name]);
    }
  }

  assignToAway(name: string): void {
    this.unassignedPlayers.update(list => list.filter(n => n !== name));
    this.homeTeamPlayers.update(list => list.filter(n => n !== name));
    if (!this.awayTeamPlayers().includes(name)) {
      this.awayTeamPlayers.update(list => [...list, name]);
    }
  }

  moveToUnassigned(name: string): void {
    this.homeTeamPlayers.update(list => list.filter(n => n !== name));
    this.awayTeamPlayers.update(list => list.filter(n => n !== name));
    if (!this.unassignedPlayers().includes(name)) {
      this.unassignedPlayers.update(list => [...list, name]);
    }
  }

  generateRandomTeams(): void {
    const all = [
      ...this.homeTeamPlayers(),
      ...this.awayTeamPlayers(),
      ...this.unassignedPlayers()
    ];

    if (all.length < 2) {
      this.message.warning('Servono almeno 2 prenotati per generare le squadre.');
      return;
    }

    // Shuffle array randomly
    const shuffled = [...all].sort(() => Math.random() - 0.5);
    const mid = Math.ceil(shuffled.length / 2);

    const home = shuffled.slice(0, mid);
    const away = shuffled.slice(mid);

    this.homeTeamPlayers.set(home);
    this.awayTeamPlayers.set(away);
    this.unassignedPlayers.set([]);

    this.message.success('Squadre divise casualmente!');
  }

  handleSave(): void {
    if (this.homeTeamPlayers().length === 0 && this.awayTeamPlayers().length === 0) {
      this.message.warning('Assegna almeno un giocatore ad una delle squadre.');
      return;
    }

    this.isConfirmLoading = true;
    this.submit.emit({
      homePlayerNames: this.homeTeamPlayers(),
      awayPlayerNames: this.awayTeamPlayers()
    });
  }

  handleCancel(): void {
    this.cancel.emit();
  }
}
