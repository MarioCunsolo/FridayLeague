import { Component, inject, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatchService } from 'src/app/shared/service/match.service';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { AuthService } from 'src/app/shared/service/auth.service';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss'],
  standalone: true,
  imports: [RouterLink, DatePipe, TitleCasePipe]
})
export class HomepageComponent {
  private matchService = inject(MatchService);
  private router = inject(Router);
  public authService = inject(AuthService);

  lastMatch = computed(() => this.matchService.getLastMatch());
  nextMatch = computed(() => this.matchService.getNextMatch());

  goToMatchDetails(matchId: number) {
    this.router.navigate(['/calendario'], { queryParams: { matchId } });
  }
}
