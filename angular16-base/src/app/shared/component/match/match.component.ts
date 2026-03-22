import { Component, signal } from '@angular/core';
import { MatchDetailComponent } from '../match-detail/match-detail.component';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
    selector: 'app-match',
    templateUrl: './match.component.html',
    styleUrls: ['./match.component.css'],
    standalone: true,
    imports: [MatchDetailComponent, DatePipe, NzButtonModule, NzIconModule]
})
export class MatchComponent {
  showMatchDetails = signal(false);
  selectedMatch = signal<any>(null);

  openMatchDetails(match: any) {
    this.selectedMatch.set(match);
    this.showMatchDetails.set(true);
  }

  closeMatchDetails() {
    this.showMatchDetails.set(false);
    this.selectedMatch.set(null);
  }

  // Dati di esempio per le partite giocate
  matches = signal([
    {
      id: 1,
      homeTeam: 'Squali Rossi',
      awayTeam: 'Leoni FC',
      homeScore: 2,
      awayScore: 4,
      status: 'Terminata',
      date: new Date('2026-02-20T21:00:00'),
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
    },
    {
      id: 2,
      homeTeam: 'Aquile Nere',
      awayTeam: 'Squali Rossi',
      homeScore: 1,
      awayScore: 1,
      status: 'Terminata',
      date: new Date('2026-02-13T20:30:00'),
      homePlayers: [
        { name: 'Alice Astri', goals: 1, assists: 0 },
        { name: 'Bob Belli', goals: 0, assists: 1 },
        { name: 'Carla Canti', goals: 0, assists: 0 },
        { name: 'Dario Danni', goals: 0, assists: 0 },
        { name: 'Elena Esposito', goals: 0, assists: 0 },
        { name: 'Fabio Fatti', goals: 0, assists: 0 },
        { name: 'Gino Gialli', goals: 0, assists: 0 }
      ],
      awayPlayers: [
        { name: 'Mario Cunsolo', goals: 1, assists: 0 },
        { name: 'Salvatore Vitale', goals: 0, assists: 1 },
        { name: 'Giuseppe Rossi', goals: 0, assists: 0 },
        { name: 'Luca Bianchi', goals: 0, assists: 0 },
        { name: 'Marco Neri', goals: 0, assists: 0 },
        { name: 'Andrea Gialli', goals: 0, assists: 0 },
        { name: 'Paolo Rossi', goals: 0, assists: 0 }
      ]
    },
    {
      id: 3,
      homeTeam: 'Tigri Bianche',
      awayTeam: 'Pirati del Campo',
      homeScore: 3,
      awayScore: 0,
      status: 'Terminata',
      date: new Date('2026-02-12T19:00:00'),
      homePlayers: [
        { name: 'Ugo Ugolini', goals: 2, assists: 0 },
        { name: 'Vito Vitale', goals: 1, assists: 1 },
        { name: 'Walter Wally', goals: 0, assists: 1 },
        { name: 'Xaver Xavi', goals: 0, assists: 0 },
        { name: 'Yuri Yor', goals: 0, assists: 0 },
        { name: 'Zeno Zen', goals: 0, assists: 0 },
        { name: 'Ada Adami', goals: 0, assists: 0 }
      ],
      awayPlayers: [
        { name: 'Pedro Pirata', goals: 0, assists: 0 },
        { name: 'Jack Jack', goals: 0, assists: 0 },
        { name: 'Morgan More', goals: 0, assists: 0 },
        { name: 'Black Beard', goals: 0, assists: 0 },
        { name: 'Hook Hook', goals: 0, assists: 0 },
        { name: 'Calico Cal', goals: 0, assists: 0 },
        { name: 'Silver Sil', goals: 0, assists: 0 }
      ]
    },
    {
      id: 4,
      homeTeam: 'Squali Rossi',
      awayTeam: 'Lupi Selvaggi',
      homeScore: 5,
      awayScore: 2,
      status: 'Terminata',
      date: new Date('2026-02-06T21:00:00'),
      homePlayers: [
        { name: 'Mario Cunsolo', goals: 3, assists: 0 },
        { name: 'Salvatore Vitale', goals: 1, assists: 2 },
        { name: 'Giuseppe Rossi', goals: 1, assists: 1 },
        { name: 'Luca Bianchi', goals: 0, assists: 1 },
        { name: 'Marco Neri', goals: 0, assists: 0 },
        { name: 'Andrea Gialli', goals: 0, assists: 0 },
        { name: 'Paolo Rossi', goals: 0, assists: 0 }
      ],
      awayPlayers: [
        { name: 'Lupo One', goals: 1, assists: 0 },
        { name: 'Lupo Two', goals: 1, assists: 1 },
        { name: 'Lupo Three', goals: 0, assists: 1 },
        { name: 'Lupo Four', goals: 0, assists: 0 },
        { name: 'Lupo Five', goals: 0, assists: 0 },
        { name: 'Lupo Six', goals: 0, assists: 0 },
        { name: 'Lupo Seven', goals: 0, assists: 0 }
      ]
    }
  ]);

}
