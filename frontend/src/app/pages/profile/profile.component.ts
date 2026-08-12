import { ChangeDetectionStrategy, Component, signal, computed, inject, effect, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatchDetailComponent } from 'src/app/shared/component/match-detail/match-detail.component';
import { UserStats } from 'src/app/models/interface/user-stats.interface';
import { FormsModule } from '@angular/forms';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { AuthService } from 'src/app/shared/service/auth.service';
import { PlayerService } from 'src/app/shared/service/player.service';
import { MatchService } from 'src/app/shared/service/match.service';
import { AuthorizationService } from 'src/app/shared/service/authorization.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: true,
  imports: [CommonModule, MatchDetailComponent, NzSelectModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent {
  public authService = inject(AuthService);
  private playerService = inject(PlayerService);
  private matchService = inject(MatchService);
  private authorization = inject(AuthorizationService);
  private destroyRef = inject(DestroyRef);

  showMatchDetails = signal(false);

  availableSeasons = this.matchService.availableSeasons;
  selectedSeason = signal(String(new Date().getFullYear()));

  // Calcolo del ruolo attivo nella lega
  userRuolo = computed(() => {
    return this.authorization.activeRole(this.authService.currentUser()) ?? 'GIOCATORE';
  });

  userStats = signal<UserStats[]>([]);

  constructor() {
    effect(() => {
      const userId = this.authService.currentUser()?.id;
      const season = this.selectedSeason();
      if (!userId) return;

      this.playerService.getPlayerStats(userId, season).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(stats => {
        this.userStats.set(stats);
      });
    });
  }

  onSeasonChange(index: number | string) {
    const season = typeof index === 'number' ? this.availableSeasons()[index] : index;
    this.selectedSeason.set(season);
  }

  selectedMatch = computed(() => this.matchService.getLastMatch());

  openMatchDetails() {
    this.showMatchDetails.set(true);
  }

  closeMatchDetails() {
    this.showMatchDetails.set(false);
  }
}
