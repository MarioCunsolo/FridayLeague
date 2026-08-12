import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Match, MatchStatus } from 'src/app/models/interface/match.interface';
import { MatchService } from 'src/app/shared/service/match.service';
import { AuthService } from 'src/app/shared/service/auth.service';
import { MatchDetailComponent } from 'src/app/shared/component/match-detail/match-detail.component';
import { AddMatchModalComponent, NewMatchData } from './add-match-modal/add-match-modal.component';

@Component({
  selector: 'app-match',
  templateUrl: './match.component.html',
  styleUrls: ['./match.component.scss'],
  standalone: true,
  imports: [MatchDetailComponent, AddMatchModalComponent, DatePipe, NzButtonModule, NzIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MatchComponent {
  private readonly matchService = inject(MatchService);
  private readonly route = inject(ActivatedRoute);
  private readonly message = inject(NzMessageService);
  protected readonly authService = inject(AuthService);
  private readonly queryParams = toSignal(this.route.queryParams, { initialValue: {} as Record<string, string> });

  readonly MatchStatus = MatchStatus;
  readonly showMatchDetails = signal(false);
  readonly selectedMatchId = signal<number | null>(null);
  readonly isAddMatchModalVisible = signal(false);
  readonly matches = this.matchService.getMatches();
  private readonly requestedMatchId = computed(() => {
    const id = Number(this.queryParams()['matchId']);
    return Number.isInteger(id) && id > 0 ? id : null;
  });
  readonly selectedMatch = computed(() => {
    const id = this.selectedMatchId();
    return id === null ? null : this.matches().find(match => match.id === id) ?? null;
  });
  readonly groupedMatches = computed(() => {
    const currentYear = Number(this.matchService.availableSeasons()[0] ?? new Date().getFullYear());
    const formatter = new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' });
    const groups = new Map<string, Match[]>();
    for (const match of this.matches().filter(item => item.date.getFullYear() === currentYear)) {
      const key = formatter.format(match.date);
      groups.set(key, [...(groups.get(key) ?? []), match]);
    }
    return [...groups.entries()].map(([month, matches]) => ({ month, matches }));
  });
  readonly nextMatchId = computed(() => this.matches()
    .filter(match => match.status === MatchStatus.PROGRAMMATA && match.date.getTime() > Date.now())
    .sort((first, second) => first.date.getTime() - second.date.getTime())[0]?.id ?? null);

  constructor() {
    effect(() => {
      const id = this.requestedMatchId();
      if (id !== null && this.matchService.getMatchById(id)) this.openMatchDetails(this.matchService.getMatchById(id)!);
    });
  }

  openMatchDetails(match: Match): void {
    this.selectedMatchId.set(match.id);
    this.showMatchDetails.set(true);
  }

  closeMatchDetails(): void {
    this.showMatchDetails.set(false);
    this.selectedMatchId.set(null);
  }

  openAddMatchModal(): void { this.isAddMatchModalVisible.set(true); }

  handleMatchSubmit(newMatch: NewMatchData): void {
    this.matchService.createMatch(newMatch).subscribe({
      next: () => {
        this.message.success('Partita creata con successo!');
        this.isAddMatchModalVisible.set(false);
      },
      error: () => {
        this.message.error('Errore durante la creazione della partita.');
        this.isAddMatchModalVisible.set(false);
      }
    });
  }

  handleMatchCancel(): void { this.isAddMatchModalVisible.set(false); }
}
