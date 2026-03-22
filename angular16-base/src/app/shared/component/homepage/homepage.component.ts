import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatchDetailComponent } from '../match-detail/match-detail.component';
import { MatchService } from '../../service/match.service';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css'],
  standalone: true,
  imports: [RouterLink, MatchDetailComponent]
})
export class HomepageComponent {
  private matchService = inject(MatchService);
  private router = inject(Router);

  selectedMatch = signal(this.matchService.getLastMatch());

  openMatchDetails() {
    const match = this.selectedMatch();
    if (match) {
      this.router.navigate(['/partite'], { queryParams: { matchId: match.id } });
    }
  }
}
