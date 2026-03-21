import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatchDetailComponent } from '../match-detail/match-detail.component';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css'],
  standalone: true,
  imports: [RouterLink, MatchDetailComponent]
})
export class HomepageComponent {
  showMatchDetails = signal(false);
  selectedMatch = signal({
    homeTeam: 'Squali Rossi',
    awayTeam: 'Leoni FC',
    homeScore: 2,
    awayScore: 4,
    status: 'Terminata',
    date: new Date()
  });

  openMatchDetails() {
    this.showMatchDetails.set(true);
  }

  closeMatchDetails() {
    this.showMatchDetails.set(false);
  }
}
