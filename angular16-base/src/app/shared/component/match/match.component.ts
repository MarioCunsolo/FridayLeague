import { Component } from '@angular/core';

@Component({
  selector: 'app-match',
  templateUrl: './match.component.html',
  styleUrls: ['./match.component.css']
})
export class MatchComponent {
  showMatchDetails: boolean = false;
  selectedMatch: any = null;

  openMatchDetails(match: any) {
    this.selectedMatch = match;
    this.showMatchDetails = true;
  }

  closeMatchDetails() {
    this.showMatchDetails = false;
    this.selectedMatch = null;
  }

  // Dati di esempio per le partite giocate
  matches = [
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
  ];

}
