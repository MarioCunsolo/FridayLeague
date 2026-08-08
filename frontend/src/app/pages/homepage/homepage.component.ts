import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatchService } from 'src/app/shared/service/match.service';
import { StatsService } from 'src/app/shared/service/stats.service';
import { AuthService } from 'src/app/shared/service/auth.service';
import { DatePipe, TitleCasePipe, CommonModule } from '@angular/common';
import { PlayerStats } from 'src/app/models/interface/player-stats.interface';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, TitleCasePipe]
})
export class HomepageComponent implements OnInit {
  public matchService = inject(MatchService);
  private statsService = inject(StatsService);
  private router = inject(Router);
  public authService = inject(AuthService);

  scorers = signal<PlayerStats[]>([]);
  assists = signal<PlayerStats[]>([]);

  lastMatch = computed(() => this.matchService.getLastMatch());
  nextMatch = computed(() => this.matchService.getNextMatch());

  // KPI Computations
  totalMatchesPlayed = computed(() => this.matchService.pastMatches().length);
  
  totalGoalsScored = computed(() => 
    this.matchService.pastMatches().reduce((acc, m) => acc + (m.homeScore || 0) + (m.awayScore || 0), 0)
  );

  avgGoalsPerMatch = computed(() => {
    const total = this.totalMatchesPlayed();
    return total > 0 ? (this.totalGoalsScored() / total).toFixed(1) : '0';
  });

  topScorer = computed(() => {
    const list = this.scorers();
    return list.length > 0 ? list[0] : null;
  });

  top3Scorers = computed(() => this.scorers().slice(0, 3));
  top3Assists = computed(() => this.assists().slice(0, 3));

  ngOnInit(): void {
    this.statsService.getScorers().subscribe({
      next: (data) => this.scorers.set(data),
      error: () => this.scorers.set([])
    });

    this.statsService.getAssists().subscribe({
      next: (data) => this.assists.set(data),
      error: () => this.assists.set([])
    });
  }

  goToMatchDetails(matchId: number): void {
    this.router.navigate(['/calendario'], { queryParams: { matchId } });
  }

  goToStats(): void {
    this.router.navigate(['/statistiche']);
  }
}
