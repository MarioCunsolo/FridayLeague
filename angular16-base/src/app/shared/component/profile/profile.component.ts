import { Component, signal } from '@angular/core';
import { MatchDetailComponent } from '../match-detail/match-detail.component';
import { RouterLink } from '@angular/router';
import { UserStats } from '../../../models/interface/user-stats.interface';
import { Match } from '../../../models/interface/match.interface';


@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.css'],
    standalone: true,
    imports: [MatchDetailComponent]
})
export class ProfileComponent {
  showMatchDetails = signal(false);
  userStats = signal<UserStats[]>([
    { label: 'GOAL', value: 12, icon: 'fa-futbol-o', colorClass: 'text-success' },
    { label: 'ASSIST', value: 8, icon: 'fa-handshake-o', colorClass: 'text-success' },
    { label: 'MAN OF THE MATCH', value: 3, icon: 'fa-trophy', colorClass: 'text-success' },
    { label: 'PARTITE GIOCATE', value: 24, icon: 'fa-line-chart', colorClass: 'text-success' }
  ]);

  selectedMatch = signal<Partial<Match>>({
    homeTeam: 'Squali Rossi',
    awayTeam: 'Leoni FC',
    homeScore: 2,
    awayScore: 4,
    status: 'TERMINATA',
    homePlayers: [
      { name: 'Mario Cunsolo', goals: 1, assists: 1 },
      { name: 'Salvatore Vitale', goals: 1, assists: 0 },
      { name: 'Giuseppe Rossi', goals: 0, assists: 0 },
      { name: 'Luca Bianchi', goals: 0, assists: 1 },
      { name: 'Marco Neri', goals: 0, assists: 0 },
      { name: 'Andrea Gialli', goals: 0, assists: 0 },
      { name: 'Paolo Rossi', goals: 0, assists: 0 }
    ],
    awayPlayers: [
      { name: 'Roberto Verdi', goals: 2, assists: 0 },
      { name: 'Franco Nipotini', goals: 1, assists: 1 },
      { name: 'Giorgio Vanni', goals: 1, assists: 1 },
      { name: 'Stefano Sogni', goals: 0, assists: 2 },
      { name: 'Davide Danni', goals: 0, assists: 0 },
      { name: 'Claudio Canti', goals: 0, assists: 0 },
      { name: 'Enzo Esposito', goals: 0, assists: 0 }
    ]
  });

  openMatchDetails() {
    this.showMatchDetails.set(true);
  }

  closeMatchDetails() {
    this.showMatchDetails.set(false);
  }
}
