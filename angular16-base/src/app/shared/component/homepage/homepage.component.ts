import { Component, signal } from '@angular/core';
import { MatchDetailComponent } from '../match-detail/match-detail.component';
import { RouterLink } from '@angular/router';


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
    awayScore: 4
  });

  openMatchDetails() {
    this.showMatchDetails.set(true);
  }

  closeMatchDetails() {
    this.showMatchDetails.set(false);
  }
}
