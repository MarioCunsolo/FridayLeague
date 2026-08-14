import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Match } from '../../../../models/interface/match.interface';
import { injectAppOverlayData, injectAppOverlayRef } from '../../../../shared/overlay/app-overlay-injectors';
import { ReservationService } from '../../../../shared/service/reservation.service';

export interface LineupFormDialogData {
  match: Match;
}

export interface LineupFormResult {
  homePlayerNames: string[];
  awayPlayerNames: string[];
}

@Component({
  selector: 'app-lineup-form',
  standalone: true,
  imports: [NzButtonModule],
  templateUrl: './lineup-form.component.html',
  styleUrl: './lineup-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LineupFormComponent implements OnInit {
  readonly data = injectAppOverlayData<LineupFormDialogData>();
  private readonly overlayRef = injectAppOverlayRef<LineupFormResult>();
  private readonly reservationService = inject(ReservationService);
  private readonly message = inject(NzMessageService);

  readonly homeTeamPlayers = signal<string[]>([]);
  readonly awayTeamPlayers = signal<string[]>([]);
  readonly unassignedPlayers = signal<string[]>([]);

  ngOnInit(): void {
    const match = this.data.match;
    const existingHome = (match.homePlayers ?? []).map(player => player.name);
    const existingAway = (match.awayPlayers ?? []).map(player => player.name);

    this.homeTeamPlayers.set(existingHome);
    this.awayTeamPlayers.set(existingAway);

    this.reservationService.loadReservations().subscribe({
      next: reservations => {
        const unassigned = reservations
          .map(reservation => reservation.nomeCognome)
          .filter(name => !existingHome.includes(name) && !existingAway.includes(name));
        this.unassignedPlayers.set(unassigned);
      },
      error: () => this.message.error('Errore nel caricamento delle prenotazioni.')
    });
  }

  assignToHome(name: string): void {
    this.unassignedPlayers.update(list => list.filter(item => item !== name));
    this.awayTeamPlayers.update(list => list.filter(item => item !== name));
    if (!this.homeTeamPlayers().includes(name)) this.homeTeamPlayers.update(list => [...list, name]);
  }

  assignToAway(name: string): void {
    this.unassignedPlayers.update(list => list.filter(item => item !== name));
    this.homeTeamPlayers.update(list => list.filter(item => item !== name));
    if (!this.awayTeamPlayers().includes(name)) this.awayTeamPlayers.update(list => [...list, name]);
  }

  moveToUnassigned(name: string): void {
    this.homeTeamPlayers.update(list => list.filter(item => item !== name));
    this.awayTeamPlayers.update(list => list.filter(item => item !== name));
    if (!this.unassignedPlayers().includes(name)) this.unassignedPlayers.update(list => [...list, name]);
  }

  generateRandomTeams(): void {
    const players = [
      ...this.homeTeamPlayers(),
      ...this.awayTeamPlayers(),
      ...this.unassignedPlayers()
    ];

    if (players.length < 2) {
      this.message.warning('Servono almeno 2 prenotati per generare le squadre.');
      return;
    }

    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const middle = Math.ceil(shuffled.length / 2);
    this.homeTeamPlayers.set(shuffled.slice(0, middle));
    this.awayTeamPlayers.set(shuffled.slice(middle));
    this.unassignedPlayers.set([]);
    this.message.success('Squadre divise casualmente!');
  }

  save(): void {
    if (this.homeTeamPlayers().length === 0 && this.awayTeamPlayers().length === 0) {
      this.message.warning('Assegna almeno un giocatore ad una delle squadre.');
      return;
    }

    this.overlayRef.close({
      homePlayerNames: this.homeTeamPlayers(),
      awayPlayerNames: this.awayTeamPlayers()
    });
  }

  cancel(): void {
    this.overlayRef.dismiss();
  }
}
