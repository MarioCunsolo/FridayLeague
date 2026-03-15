import { Component, signal } from '@angular/core';
import { MatchDetailComponent } from '../match-detail/match-detail.component';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';

@Component({
    selector: 'app-match',
    templateUrl: './match.component.html',
    styleUrls: ['./match.component.css'],
    imports: [RouterLink, MatchDetailComponent, DatePipe]
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
      date: new Date('2026-02-20T21:00:00')
    },
    {
      id: 2,
      homeTeam: 'Aquile Nere',
      awayTeam: 'Squali Rossi',
      homeScore: 1,
      awayScore: 1,
      status: 'Terminata',
      date: new Date('2026-02-13T20:30:00')
    },
    {
      id: 3,
      homeTeam: 'Tigri Bianche',
      awayTeam: 'Pirati del Campo',
      homeScore: 3,
      awayScore: 0,
      status: 'Terminata',
      date: new Date('2026-02-12T19:00:00')
    },
    {
      id: 4,
      homeTeam: 'Squali Rossi',
      awayTeam: 'Lupi Selvaggi',
      homeScore: 5,
      awayScore: 2,
      status: 'Terminata',
      date: new Date('2026-02-06T21:00:00')
    }
  ]);

}
