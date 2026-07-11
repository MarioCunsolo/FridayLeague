import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatchService } from 'src/app/shared/service/match.service';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { AuthService } from 'src/app/shared/service/auth.service';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css'],
  standalone: true,
  imports: [RouterLink, DatePipe, TitleCasePipe]
})
export class HomepageComponent {
  private matchService = inject(MatchService);
  private router = inject(Router);
  public authService = inject(AuthService);

  lastMatch = signal(this.matchService.getLastMatch());
  nextMatch = signal(this.matchService.getNextMatch());

  goToMatchDetails(matchId: number) {
    this.router.navigate(['/calendario'], { queryParams: { matchId } });
  }
}
