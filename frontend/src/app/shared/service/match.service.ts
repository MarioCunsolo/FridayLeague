import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GoalEvent, Match, MatchStatus, Player } from '../../models/interface/match.interface';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MatchService {
  private http = inject(HttpClient);
  private readonly BASE_URL = `${environment.apiUrl}/matches`;

  private matches = signal<Match[]>([
    {
      id: 16,
      homeTeam: 'Squali Rossi',
      awayTeam: 'Pirati del Campo',
      homeScore: 1,
      awayScore: 0,
      status: MatchStatus.IN_CORSO,
      date: new Date(),
      homePlayers: [
        { name: 'Mario Cunsolo', goals: 1, assists: 0 },
        { name: 'Salvatore Vitale', goals: 0, assists: 1 },
        { name: 'Giuseppe Rossi', goals: 0, assists: 0 }
      ],
      awayPlayers: [
        { name: 'Pedro Pirata', goals: 0, assists: 0 },
        { name: 'Jack Jack', goals: 0, assists: 0 }
      ],
      goalTimeline: [
        { scorerName: 'Mario Cunsolo', isHome: true, assistName: 'Salvatore Vitale' }
      ]
    },
    {
      id: 15,
      homeTeam: 'Aquile Nere',
      awayTeam: 'Leoni FC',
      homeScore: 0,
      awayScore: 0,
      status: MatchStatus.PROGRAMMATA,
      date: new Date('2026-06-26T21:00:00')
    },
    {
      id: 14,
      homeTeam: 'Lupi Selvaggi',
      awayTeam: 'Pirati del Campo',
      homeScore: 0,
      awayScore: 0,
      status: MatchStatus.PROGRAMMATA,
      date: new Date('2026-06-19T21:00:00')
    },
    {
      id: 13,
      homeTeam: 'Squali Rossi',
      awayTeam: 'Tigri Bianche',
      homeScore: 0,
      awayScore: 0,
      status: MatchStatus.PROGRAMMATA,
      date: new Date('2026-06-12T21:00:00')
    },
    {
      id: 12,
      homeTeam: 'Leoni FC',
      awayTeam: 'Aquile Nere',
      homeScore: 0,
      awayScore: 0,
      status: MatchStatus.PROGRAMMATA,
      date: new Date('2026-06-05T21:00:00')
    },
    {
      id: 11,
      homeTeam: 'Pirati del Campo',
      awayTeam: 'Squali Rossi',
      homeScore: 0,
      awayScore: 0,
      status: MatchStatus.PROGRAMMATA,
      date: new Date('2026-04-17T21:00:00')
    },
    {
      id: 10,
      homeTeam: 'Tigri Bianche',
      awayTeam: 'Lupi Selvaggi',
      homeScore: 0,
      awayScore: 0,
      status: MatchStatus.PROGRAMMATA,
      date: new Date('2026-04-10T21:00:00')
    },
    {
      id: 6,
      homeTeam: 'Leoni FC',
      awayTeam: 'Squali Rossi',
      homeScore: 0,
      awayScore: 0,
      status: MatchStatus.PROGRAMMATA,
      date: new Date('2026-04-03T21:00:00')
    },
    {
      id: 9,
      homeTeam: 'Lupi Selvaggi',
      awayTeam: 'Aquile Nere',
      homeScore: 3,
      awayScore: 1,
      status: MatchStatus.CONCLUSA,
      date: new Date('2026-03-20T21:00:00')
    },
    {
      id: 8,
      homeTeam: 'Pirati del Campo',
      awayTeam: 'Leoni FC',
      homeScore: 2,
      awayScore: 2,
      status: MatchStatus.CONCLUSA,
      date: new Date('2026-03-13T21:00:00')
    },
    {
      id: 7,
      homeTeam: 'Tigri Bianche',
      awayTeam: 'Squali Rossi',
      homeScore: 1,
      awayScore: 4,
      status: MatchStatus.CONCLUSA,
      date: new Date('2026-03-06T21:00:00')
    },
    {
      id: 5,
      homeTeam: 'Squali Rossi',
      awayTeam: 'Tigri Bianche',
      homeScore: 0,
      awayScore: 0,
      status: MatchStatus.PROGRAMMATA,
      date: new Date('2026-03-27T21:00:00')
    },
    {
      id: 1,
      homeTeam: 'Squali Rossi',
      awayTeam: 'Leoni FC',
      homeScore: 2,
      awayScore: 4,
      status: MatchStatus.CONCLUSA,
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
    },
    {
      id: 2,
      homeTeam: 'Aquile Nere',
      awayTeam: 'Squali Rossi',
      homeScore: 1,
      awayScore: 1,
      status: MatchStatus.CONCLUSA,
      date: new Date('2026-02-13T20:30:00'),
      homePlayers: [
        { name: 'Alice Astri', goals: 1, assists: 0 },
        { name: 'Bob Belli', goals: 0, assists: 1 },
        { name: 'Carla Canti', goals: 0, assists: 0 },
        { name: 'Dario Danni', goals: 0, assists: 0 },
        { name: 'Elena Esposito', goals: 0, assists: 0 },
        { name: 'Fabio Fatti', goals: 0, assists: 0 },
        { name: 'Gino Gialli', goals: 0, assists: 0 }
      ],
      awayPlayers: [
        { name: 'Mario Cunsolo', goals: 1, assists: 0 },
        { name: 'Salvatore Vitale', goals: 0, assists: 1 },
        { name: 'Giuseppe Rossi', goals: 0, assists: 0 },
        { name: 'Luca Bianchi', goals: 0, assists: 0 },
        { name: 'Marco Neri', goals: 0, assists: 0 },
        { name: 'Andrea Gialli', goals: 0, assists: 0 },
        { name: 'Paolo Rossi', goals: 0, assists: 0 }
      ]
    },
    {
      id: 3,
      homeTeam: 'Tigri Bianche',
      awayTeam: 'Pirati del Campo',
      homeScore: 3,
      awayScore: 0,
      status: MatchStatus.CONCLUSA,
      date: new Date('2026-02-12T19:00:00'),
      homePlayers: [
        { name: 'Ugo Ugolini', goals: 2, assists: 0 },
        { name: 'Vito Vitale', goals: 1, assists: 1 },
        { name: 'Walter Wally', goals: 0, assists: 1 },
        { name: 'Xaver Xavi', goals: 0, assists: 0 },
        { name: 'Yuri Yor', goals: 0, assists: 0 },
        { name: 'Zeno Zen', goals: 0, assists: 0 },
        { name: 'Ada Adami', goals: 0, assists: 0 }
      ],
      awayPlayers: [
        { name: 'Pedro Pirata', goals: 0, assists: 0 },
        { name: 'Jack Jack', goals: 0, assists: 0 },
        { name: 'Morgan More', goals: 0, assists: 0 },
        { name: 'Black Beard', goals: 0, assists: 0 },
        { name: 'Hook Hook', goals: 0, assists: 0 },
        { name: 'Calico Cal', goals: 0, assists: 0 },
        { name: 'Silver Sil', goals: 0, assists: 0 }
      ]
    },
    {
      id: 4,
      homeTeam: 'Squali Rossi',
      awayTeam: 'Lupi Selvaggi',
      homeScore: 5,
      awayScore: 2,
      status: MatchStatus.CONCLUSA,
      date: new Date('2026-02-06T21:00:00'),
      homePlayers: [
        { name: 'Mario Cunsolo', goals: 3, assists: 0 },
        { name: 'Salvatore Vitale', goals: 1, assists: 2 },
        { name: 'Giuseppe Rossi', goals: 1, assists: 1 },
        { name: 'Luca Bianchi', goals: 0, assists: 1 },
        { name: 'Marco Neri', goals: 0, assists: 0 },
        { name: 'Andrea Gialli', goals: 0, assists: 0 },
        { name: 'Paolo Rossi', goals: 0, assists: 0 }
      ],
      awayPlayers: [
        { name: 'Lupo One', goals: 1, assists: 0 },
        { name: 'Lupo Two', goals: 1, assists: 1 },
        { name: 'Lupo Three', goals: 0, assists: 1 },
        { name: 'Lupo Four', goals: 0, assists: 0 },
        { name: 'Lupo Five', goals: 0, assists: 0 },
        { name: 'Lupo Six', goals: 0, assists: 0 },
        { name: 'Lupo Seven', goals: 0, assists: 0 }
      ]
    },
    // Season 2025
    {
      id: 101,
      homeTeam: 'Squali Rossi',
      awayTeam: 'Leoni FC',
      homeScore: 3,
      awayScore: 3,
      status: MatchStatus.CONCLUSA,
      date: new Date('2025-11-15T21:00:00')
    },
    {
      id: 102,
      homeTeam: 'Aquile Nere',
      awayTeam: 'Squali Rossi',
      homeScore: 0,
      awayScore: 2,
      status: MatchStatus.CONCLUSA,
      date: new Date('2025-05-10T21:00:00')
    },
    // Season 2024
    {
      id: 201,
      homeTeam: 'Squali Rossi',
      awayTeam: 'Lupi Selvaggi',
      homeScore: 4,
      awayScore: 1,
      status: MatchStatus.CONCLUSA,
      date: new Date('2024-12-20T21:00:00')
    },
    {
      id: 202,
      homeTeam: 'Tigri Bianche',
      awayTeam: 'Squali Rossi',
      homeScore: 2,
      awayScore: 2,
      status: MatchStatus.CONCLUSA,
      date: new Date('2024-06-15T21:00:00')
    }
  ]);

  /**
   * Recupera l'elenco delle stagioni disponibili.
   * @returns Un array di stringhe rappresentanti gli anni delle stagioni.
   */
  getAvailableSeasons() {
    return ['2024', '2025', '2026'];
  }

  /**
   * Ritorna un Signal computato che contiene l'elenco delle partite ordinate per data decrescente.
   */
  getMatches() {
    return computed(() => [...this.matches()].sort((a, b) => b.date.getTime() - a.date.getTime()));
  }

  upcomingMatches = computed(() => {
    return this.matches()
      .filter(m => m.status === MatchStatus.PROGRAMMATA)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  });

  pastMatches = computed(() => {
    return this.matches()
      .filter(m => m.status === MatchStatus.CONCLUSA)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  /**
   * Trova una partita specifica tramite il suo identificativo.
   * @param id L'ID della partita da cercare.
   * @returns La partita corrispondente o undefined se non trovata.
   */
  getMatchById(id: number) {
    return this.matches().find(m => m.id === id);
  }

  /**
   * Identifica la prossima partita programmata (quella con data più vicina al presente).
   * @returns La prossima partita o null se non ci sono partite in programma.
   */
  getNextMatch() {
    const now = Date.now();
    const programmable = this.matches()
      .filter(m => m.status === MatchStatus.PROGRAMMATA && m.date.getTime() > now)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    return programmable.length > 0 ? programmable[0] : null;
  }

  /**
   * Recupera l'ultima partita terminata (utilizzato per la card in home page e profilo).
   * @returns L'ultima partita completata o null se nessuna partita è stata giocata.
   */
  getLastMatch(): Match | null {
    const completed = this.matches()
      .filter(m => m.status === MatchStatus.CONCLUSA)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return completed.length > 0 ? completed[0] : null;
  }

  // --- API Methods ---

  /**
   * Carica l'elenco completo delle partite dal backend e aggiorna il segnale interno.
   * @returns Un Observable con l'array delle partite.
   */
  loadMatches() {
    return this.http.get<Match[]>(this.BASE_URL).pipe(
      map(matches => matches.map(m => this.parseMatchDate(m))),
      tap(matches => this.matches.set(matches))
    );
  }

  // Il backend serializza le date come stringhe ISO: HttpClient non le converte automaticamente in Date.
  private parseMatchDate(match: Match): Match {
    return { ...match, date: new Date(match.date) };
  }

  /**
   * Crea una nuova partita nel sistema.
   * @param match I dati della partita (senza ID).
   * @returns Un Observable con la partita appena creata.
   */
  createMatch(match: Omit<Match, 'id'>) {
    return this.http.post<Match>(this.BASE_URL, match).pipe(
      map(newMatch => this.parseMatchDate(newMatch)),
      tap(newMatch => this.matches.update(prev => [...prev, newMatch]))
    );
  }

  /**
   * Aggiorna i dati di una partita esistente.
   * @param id L'ID della partita da aggiornare.
   * @param match I campi della partita da modificare.
   * @returns Un Observable con la partita aggiornata.
   */
  updateMatch(id: number, match: Partial<Match>) {
    return this.http.put<Match>(`${this.BASE_URL}/${id}`, match).pipe(
      map(updatedMatch => this.parseMatchDate(updatedMatch)),
      tap(updatedMatch => this.matches.update(prev =>
        prev.map(m => m.id === id ? updatedMatch : m)
      ))
    );
  }

  /**
   * Rimuove una partita dal sistema.
   * @param id L'ID della partita da eliminare.
   * @returns Un Observable di tipo void.
   */
  deleteMatch(id: number) {
    return this.http.delete<void>(`${this.BASE_URL}/${id}`).pipe(
      tap(() => this.matches.update(prev => prev.filter(m => m.id !== id)))
    );
  }

  /**
   * Annulla una partita attualmente in corso.
   * @param id L'ID della partita da annullare.
   * @returns Un Observable con la partita aggiornata.
   */
  annullaMatch(id: number) {
    return this.http.put<Match>(`${this.BASE_URL}/${id}/annulla`, {}).pipe(
      map(updatedMatch => this.parseMatchDate(updatedMatch)),
      tap(updatedMatch => this.matches.update(prev =>
        prev.map(m => m.id === id ? updatedMatch : m)
      ))
    );
  }

  /**
   * Registra un nuovo goal per una partita in corso.
   * @param matchId L'ID della partita.
   * @param goal I dati del goal (marcatore, assist, squadra).
   * @returns Un Observable con l'evento creato.
   */
  addGoal(matchId: number, goal: GoalEvent) {
    return this.http.post<GoalEvent>(`${this.BASE_URL}/${matchId}/goals`, goal).pipe(
      tap(() => {
        this.matches.update(prev => prev.map(m => {
          if (m.id === matchId) {
            // Aggiorna lo score
            const updatedHomeScore = goal.isHome ? m.homeScore + 1 : m.homeScore;
            const updatedAwayScore = !goal.isHome ? m.awayScore + 1 : m.awayScore;
            
            // Aggiorna la timeline
            const updatedTimeline = [...(m.goalTimeline || []), goal];
            
            // Aggiorna le statistiche dei giocatori se presenti
            const updatedHomePlayers = m.homePlayers?.map(p => {
              if (goal.isHome) {
                if (p.name === goal.scorerName) return { ...p, goals: p.goals + 1 };
                if (p.name === goal.assistName) return { ...p, assists: p.assists + 1 };
              }
              return p;
            });

            const updatedAwayPlayers = m.awayPlayers?.map(p => {
              if (!goal.isHome) {
                if (p.name === goal.scorerName) return { ...p, goals: p.goals + 1 };
                if (p.name === goal.assistName) return { ...p, assists: p.assists + 1 };
              }
              return p;
            });

            return { 
              ...m, 
              homeScore: updatedHomeScore, 
              awayScore: updatedAwayScore, 
              goalTimeline: updatedTimeline,
              homePlayers: updatedHomePlayers,
              awayPlayers: updatedAwayPlayers
            };
          }
          return m;
        }));
      })
    );
  }

  /**
   * Imposta le formazioni delle due squadre per una partita in programma.
   * @param matchId L'ID della partita.
   * @param homePlayerNames Nomi dei giocatori assegnati alla squadra di casa.
   * @param awayPlayerNames Nomi dei giocatori assegnati alla squadra in trasferta.
   * @returns Un Observable con la partita aggiornata.
   */
  setupLineup(matchId: number, homePlayerNames: string[], awayPlayerNames: string[]) {
    return this.http.post<Match>(`${this.BASE_URL}/${matchId}/setup-lineup`, { homePlayerNames, awayPlayerNames }).pipe(
      map(updatedMatch => this.parseMatchDate(updatedMatch)),
      tap(updatedMatch => this.matches.update(prev =>
        prev.map(m => m.id === matchId ? updatedMatch : m)
      ))
    );
  }
}
