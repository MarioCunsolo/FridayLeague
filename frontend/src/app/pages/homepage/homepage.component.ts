import { Component, inject, computed, signal, OnInit, effect } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatchService } from 'src/app/shared/service/match.service';
import { StatsService } from 'src/app/shared/service/stats.service';
import { PlayerService } from 'src/app/shared/service/player.service';
import { AuthService } from 'src/app/shared/service/auth.service';
import { DatePipe, TitleCasePipe, CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { PlayerStats } from 'src/app/models/interface/player-stats.interface';
import { UserStats } from 'src/app/models/interface/user-stats.interface';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, TitleCasePipe, NzIconModule]
})
export class HomepageComponent implements OnInit {
  public matchService = inject(MatchService);
  private statsService = inject(StatsService);
  private playerService = inject(PlayerService);
  private router = inject(Router);
  public authService = inject(AuthService);

  scorers = signal<PlayerStats[]>([]);
  assists = signal<PlayerStats[]>([]);
  userStats = signal<UserStats[]>([]);

  lastMatch = computed(() => this.matchService.getLastMatch());
  nextMatch = computed(() => this.matchService.getNextMatch());

  // Personal User KPI Computations
  userMatchesPlayed = computed(() => 
    this.userStats().find(s => s.label === 'PARTITE')?.value || 0
  );
  
  userGoals = computed(() => 
    this.userStats().find(s => s.label === 'GOAL')?.value || 0
  );

  userAssists = computed(() => 
    this.userStats().find(s => s.label === 'ASSIST')?.value || 0
  );

  userAvgGoals = computed(() => {
    const totalMatches = this.userMatchesPlayed();
    const totalGoals = this.userGoals();
    return totalMatches > 0 ? (totalGoals / totalMatches).toFixed(1) : '0';
  });

  topScorer = computed(() => {
    const list = this.scorers();
    return list.length > 0 ? list[0] : null;
  });

  top3Scorers = computed(() => this.scorers().slice(0, 3));
  top3Assists = computed(() => this.assists().slice(0, 3));

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user?.id) {
        this.playerService.getPlayerStats(user.id).subscribe({
          next: (stats) => this.userStats.set(stats),
          error: () => this.userStats.set([])
        });
      }
    });
  }

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

  goToStats(tab?: string): void {
    if (tab) {
      this.router.navigate(['/classifiche'], { queryParams: { tab } });
    } else {
      this.router.navigate(['/classifiche']);
    }
  }
}
