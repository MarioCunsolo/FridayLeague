import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateMatchRequest, MatchDto, MatchFormData } from '../../models/api/match.models';
import { LoadState } from '../../models/load-state';
import { GoalEvent, Match, MatchStatus } from '../../models/interface/match.interface';

@Injectable({ providedIn: 'root' })
export class MatchService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/matches`;
  private readonly matchesState = signal<Match[]>([]);
  private readonly loadState = signal<LoadState>('idle');

  readonly state = this.loadState.asReadonly();
  readonly matches = computed(() => [...this.matchesState()].sort((a, b) => b.date.getTime() - a.date.getTime()));
  readonly upcomingMatches = computed(() => this.matches()
    .filter(match => match.status === MatchStatus.PROGRAMMATA)
    .sort((a, b) => a.date.getTime() - b.date.getTime()));
  readonly pastMatches = computed(() => this.matches()
    .filter(match => match.status === MatchStatus.CONCLUSA)
    .sort((a, b) => b.date.getTime() - a.date.getTime()));
  readonly availableSeasons = computed(() => [...new Set(this.matches().map(match => String(match.date.getFullYear())))]
    .sort((a, b) => b.localeCompare(a)));

  getMatches() { return this.matches; }

  loadMatches() {
    this.loadState.set('loading');
    return this.http.get<MatchDto[]>(this.baseUrl).pipe(
      tap({
        next: dtos => {
          const matches = dtos.map(dto => this.toMatch(dto));
          this.matchesState.set(matches);
          this.loadState.set(matches.length ? 'success' : 'empty');
        },
        error: () => {
          this.matchesState.set([]);
          this.loadState.set('error');
        }
      })
    );
  }

  clear(): void {
    this.matchesState.set([]);
    this.loadState.set('idle');
  }

  getMatchById(id: number): Match | undefined {
    return this.matchesState().find(match => match.id === id);
  }

  getNextMatch(): Match | null {
    const now = Date.now();
    return this.upcomingMatches().find(match => match.date.getTime() > now) ?? null;
  }

  getLastMatch(): Match | null {
    return this.pastMatches()[0] ?? null;
  }

  createMatch(match: CreateMatchRequest) {
    return this.http.post<MatchDto>(this.baseUrl, match).pipe(tap(dto => this.upsert(this.toMatch(dto))));
  }

  updateMatch(id: number, match: MatchFormData) {
    return this.http.put<MatchDto>(`${this.baseUrl}/${id}`, match).pipe(tap(dto => this.upsert(this.toMatch(dto))));
  }

  deleteMatch(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(tap(() => this.remove(id)));
  }

  annullaMatch(id: number) { return this.mutateMatch(id, 'annulla'); }
  iniziaMatch(id: number) { return this.mutateMatch(id, 'inizia'); }
  concludiMatch(id: number) { return this.mutateMatch(id, 'concludi'); }

  addGoal(matchId: number, goal: GoalEvent) {
    return this.http.post(`${this.baseUrl}/${matchId}/goals`, goal).pipe(
      // La risposta del goal non contiene l'intera formazione aggiornata: ricarichiamo una sola volta dal server.
      tap(() => void 0)
    );
  }

  setMotm(matchId: number, playerName: string, isHome: boolean) {
    return this.http.put<void>(`${this.baseUrl}/${matchId}/motm`, { playerName, isHome });
  }

  setupLineup(matchId: number, homePlayerNames: string[], awayPlayerNames: string[]) {
    return this.http.post<MatchDto>(`${this.baseUrl}/${matchId}/setup-lineup`, { homePlayerNames, awayPlayerNames })
      .pipe(tap(dto => this.upsert(this.toMatch(dto))));
  }

  private mutateMatch(id: number, action: 'annulla' | 'inizia' | 'concludi') {
    return this.http.put<MatchDto>(`${this.baseUrl}/${id}/${action}`, {}).pipe(tap(dto => this.upsert(this.toMatch(dto))));
  }

  private upsert(match: Match): void {
    this.matchesState.update(previous => {
      const exists = previous.some(item => item.id === match.id);
      return exists ? previous.map(item => item.id === match.id ? match : item) : [...previous, match];
    });
    this.loadState.set(this.matchesState().length ? 'success' : 'empty');
  }

  private remove(id: number): void {
    this.matchesState.update(previous => previous.filter(match => match.id !== id));
    this.loadState.set(this.matchesState().length ? 'success' : 'empty');
  }

  private toMatch(dto: MatchDto): Match {
    const status = Object.values(MatchStatus).includes(dto.status as MatchStatus)
      ? dto.status as MatchStatus
      : MatchStatus.PROGRAMMATA;
    return {
      ...dto,
      status,
      date: new Date(dto.date),
      goalTimeline: dto.goalTimeline.map(goal => ({
        ...goal,
        assistName: goal.assistName ?? undefined
      }))
    };
  }
}
