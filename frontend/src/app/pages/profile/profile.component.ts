import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { AuthService } from 'src/app/shared/service/auth.service';
import { PlayerService } from 'src/app/shared/service/player.service';
import { MatchService } from 'src/app/shared/service/match.service';
import { AuthorizationService } from 'src/app/shared/service/authorization.service';
import { PlayerProfile } from 'src/app/models/api/profile.models';
import { LoadState } from 'src/app/models/load-state';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: true,
  imports: [CommonModule, DatePipe, DecimalPipe, FormsModule, RouterLink, NzSelectModule, NzSpinModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent {
  public readonly authService = inject(AuthService);
  private readonly playerService = inject(PlayerService);
  private readonly matchService = inject(MatchService);
  private readonly authorization = inject(AuthorizationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private requestVersion = 0;
  readonly profile = signal<PlayerProfile | null>(null);
  readonly state = signal<LoadState>('idle');
  readonly errorMessage = signal<string | null>(null);
  readonly selectedSeason = signal(String(new Date().getFullYear()));
  readonly availableSeasons = computed(() => {
    const seasons = this.matchService.availableSeasons();
    const fallback = String(new Date().getFullYear());
    return seasons.length ? seasons : [fallback];
  });
  readonly userRuolo = computed(() =>
    this.authorization.activeRole(this.authService.currentUser()) ?? 'GIOCATORE'
  );
  readonly summary = computed(() => this.profile()?.summary ?? null);
  readonly stats = computed(() => this.profile()?.stats ?? []);
  readonly lastMatch = computed(() => this.profile()?.recentMatches[0] ?? null);
  readonly otherRecentMatches = computed(() => this.profile()?.recentMatches.slice(1) ?? []);
  readonly performance = computed(() => this.profile()?.performance ?? []);
  readonly performanceMax = computed(() => Math.max(
    1,
    ...this.performance().map(point => point.goals + point.assists)
  ));

  constructor() {
    effect(() => {
      const userId = this.authService.currentUser()?.id;
      const season = this.selectedSeason();
      if (!userId) return;

      const version = ++this.requestVersion;
      this.state.set('loading');
      this.errorMessage.set(null);
      this.playerService.getPlayerProfile(userId, season)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: profile => {
            if (version !== this.requestVersion) return;
            this.profile.set(profile);
            this.state.set('success');
          },
          error: () => {
            if (version !== this.requestVersion) return;
            this.profile.set(null);
            this.state.set('error');
            this.errorMessage.set('Non è stato possibile caricare il profilo. Riprova tra poco.');
          }
        });
    });
  }

  onSeasonChange(season: string): void {
    this.selectedSeason.set(season);
  }

  performanceHeight(goals: number, assists: number): number {
    return Math.max(8, ((goals + assists) / this.performanceMax()) * 100);
  }

  goToMatch(matchId: number): void {
    void this.router.navigate(['/calendario'], { queryParams: { matchId } });
  }
}
