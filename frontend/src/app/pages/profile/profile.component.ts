import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatchDetailComponent } from 'src/app/shared/component/match-detail/match-detail.component';
import { UserStats } from 'src/app/models/interface/user-stats.interface';
import { Match, MatchStatus } from 'src/app/models/interface/match.interface';
import { FormsModule } from '@angular/forms';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { AuthService } from 'src/app/shared/service/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  standalone: true,
  imports: [CommonModule, MatchDetailComponent, NzSelectModule, FormsModule]
})
export class ProfileComponent {
  public authService = inject(AuthService);

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

  private seasonStats: Record<string, UserStats[]> = {
    '2026': [
      { label: 'GOAL', value: 12, icon: 'fa-futbol-o', colorClass: 'text-success', rank: 2 },
      { label: 'ASSIST', value: 8, icon: 'fa-handshake-o', colorClass: 'text-success', rank: 4 },
      { label: 'MOTM', value: 3, icon: 'fa-trophy', colorClass: 'text-success', rank: 1 },
      { label: 'PARTITE', value: 24, icon: 'fa-line-chart', colorClass: 'text-success' }
    ],
    '2025': [
      { label: 'GOAL', value: 18, icon: 'fa-futbol-o', colorClass: 'text-success', rank: 1 },
      { label: 'ASSIST', value: 12, icon: 'fa-handshake-o', colorClass: 'text-success', rank: 2 },
      { label: 'MOTM', value: 5, icon: 'fa-trophy', colorClass: 'text-success', rank: 1 },
      { label: 'PARTITE', value: 30, icon: 'fa-line-chart', colorClass: 'text-success' }
    ],
    '2024': [
      { label: 'GOAL', value: 10, icon: 'fa-futbol-o', colorClass: 'text-success', rank: 5 },
      { label: 'ASSIST', value: 5, icon: 'fa-handshake-o', colorClass: 'text-success', rank: 8 },
      { label: 'MOTM', value: 2, icon: 'fa-trophy', colorClass: 'text-success', rank: 3 },
      { label: 'PARTITE', value: 20, icon: 'fa-line-chart', colorClass: 'text-success' }
    ]
  };

  userStats = computed(() => this.seasonStats[this.selectedSeason()]);

  onSeasonChange(index: number | string) {
    const season = typeof index === 'number' ? this.availableSeasons[index] : index;
    this.selectedSeason.set(season);
  }

  selectedMatch = signal<Match>({
    id: 1,
    homeTeam: 'Squali Rossi',
    awayTeam: 'Leoni FC',
    homeScore: 2,
    awayScore: 4,
    status: MatchStatus.TERMINATA,
    date: new Date('2026-02-20T21:00:00'),
    homePlayers: [
      { name: 'Mario Cunsolo', goals: 1, assists: 1 },
      { name: 'Salvatore Vitale', goals: 1, assists: 0 },
      { name: 'Giuseppe Rossi', goals: 0, assists: 0 },
      { name: 'Luca Bianchi', goals: 0, assists: 1 },
      { name: 'Marco Neri', goals: 0, assists: 0 },
      { name: 'Andrea Gialli', goals: 0, assists: 0 },
      { name: 'Paolo Rossi', goals: 0, assists: 0 }
    ],
    awayPlayers: [
      { name: 'Roberto Verdi', goals: 2, assists: 0 },
      { name: 'Franco Nipotini', goals: 1, assists: 1 },
      { name: 'Giorgio Vanni', goals: 1, assists: 1 },
      { name: 'Stefano Sogni', goals: 0, assists: 2 },
      { name: 'Davide Danni', goals: 0, assists: 0 },
      { name: 'Claudio Canti', goals: 0, assists: 0 },
      { name: 'Enzo Esposito', goals: 0, assists: 0 }
    ]
  });

  openMatchDetails() {
    this.showMatchDetails.set(true);
  }

  closeMatchDetails() {
    this.showMatchDetails.set(false);
  }
}
