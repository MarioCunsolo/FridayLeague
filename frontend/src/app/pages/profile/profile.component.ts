import { Component, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatchDetailComponent } from 'src/app/shared/component/match-detail/match-detail.component';
import { UserStats } from 'src/app/models/interface/user-stats.interface';
import { FormsModule } from '@angular/forms';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { AuthService } from 'src/app/shared/service/auth.service';
import { PlayerService } from 'src/app/shared/service/player.service';
import { MatchService } from 'src/app/shared/service/match.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  standalone: true,
  imports: [CommonModule, MatchDetailComponent, NzSelectModule, FormsModule]
})
export class ProfileComponent {
  public authService = inject(AuthService);
  private playerService = inject(PlayerService);
  private matchService = inject(MatchService);

  showMatchDetails = signal(false);

  availableSeasons = ['2024', '2025', '2026'];
  selectedSeason = signal('2026');

  // Calcolo del ruolo attivo nella lega
  userRuolo = computed(() => {
    const user = this.authService.currentUser();
    if (!user || !user.legaId || !user.leghe) return 'GIOCATORE';
    const activeLega = user.leghe.find((l: any) => l.id === user.legaId);
    return activeLega ? activeLega.ruolo : 'GIOCATORE';
  });

  userStats = signal<UserStats[]>([]);

  constructor() {
    effect(() => {
      const userId = this.authService.currentUser()?.id;
      const season = this.selectedSeason();
      if (!userId) return;

      this.playerService.getPlayerStats(userId, season).subscribe(stats => {
        this.userStats.set(stats);
      });
    });
  }

  onSeasonChange(index: number | string) {
    const season = typeof index === 'number' ? this.availableSeasons[index] : index;
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
