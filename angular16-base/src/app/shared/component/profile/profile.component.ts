import { Component, signal } from '@angular/core';
import { MatchDetailComponent } from '../match-detail/match-detail.component';
import { RouterLink } from '@angular/router';


@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.css'],
    standalone: true,
    imports: [MatchDetailComponent]
})
export class ProfileComponent {
  showMatchDetails = signal(false);
  userStats = signal([
    { label: 'GOAL', value: 12, icon: 'fa-futbol-o', colorClass: 'text-success' },
    { label: 'ASSIST', value: 8, icon: 'fa-handshake-o', colorClass: 'text-success' },
    { label: 'MAN OF THE MATCH', value: 3, icon: 'fa-trophy', colorClass: 'text-success' },
    { label: 'PARTITE GIOCATE', value: 24, icon: 'fa-line-chart', colorClass: 'text-success' }
  ]);

  selectedMatch = signal({
    homeTeam: 'Squali Rossi',
    awayTeam: 'Leoni FC',
    homeScore: 2,
    awayScore: 4,
    status: 'TERMINATA'
  });

  openMatchDetails() {
    this.showMatchDetails.set(true);
  }

  closeMatchDetails() {
    this.showMatchDetails.set(false);
  }
}
