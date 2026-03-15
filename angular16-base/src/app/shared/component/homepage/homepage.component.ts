import { Component } from '@angular/core';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent {
  showMatchDetails: boolean = false;
  selectedMatch: any = {
    homeTeam: 'Squali Rossi',
    awayTeam: 'Leoni FC',
    homeScore: 2,
    awayScore: 4
  };

  openMatchDetails() {
    this.showMatchDetails = true;
  }

  closeMatchDetails() {
    this.showMatchDetails = false;
  }
}
