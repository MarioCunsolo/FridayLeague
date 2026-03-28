import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Match, Player } from '../../models/interface/match.interface';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MatchService {
  private http = inject(HttpClient);
  private readonly BASE_URL = 'http://localhost:8080/api/matches';

  private matches = signal<Match[]>([
    {
      id: 15,
      homeTeam: 'Aquile Nere',
      awayTeam: 'Leoni FC',
      homeScore: 0,
      awayScore: 0,
      status: 'Programmata',
      date: new Date('2026-06-26T21:00:00')
    },
    {
      id: 14,
      homeTeam: 'Lupi Selvaggi',
      awayTeam: 'Pirati del Campo',
      homeScore: 0,
      awayScore: 0,
      status: 'Programmata',
      date: new Date('2026-06-19T21:00:00')
    },
    {
      id: 13,
      homeTeam: 'Squali Rossi',
      awayTeam: 'Tigri Bianche',
      homeScore: 0,
      awayScore: 0,
      status: 'Programmata',
      date: new Date('2026-06-12T21:00:00')
    },
    {
      id: 12,
      homeTeam: 'Leoni FC',
      awayTeam: 'Aquile Nere',
      homeScore: 0,
      awayScore: 0,
      status: 'Programmata',
      date: new Date('2026-06-05T21:00:00')
    },
    {
      id: 11,
      homeTeam: 'Pirati del Campo',
      awayTeam: 'Squali Rossi',
      homeScore: 0,
      awayScore: 0,
      status: 'Programmata',
      date: new Date('2026-04-17T21:00:00')
    },
    {
      id: 10,
      homeTeam: 'Tigri Bianche',
      awayTeam: 'Lupi Selvaggi',
      homeScore: 0,
      awayScore: 0,
      status: 'Programmata',
      date: new Date('2026-04-10T21:00:00')
    },
    {
      id: 6,
      homeTeam: 'Leoni FC',
      awayTeam: 'Squali Rossi',
      homeScore: 0,
      awayScore: 0,
      status: 'Programmata',
      date: new Date('2026-04-03T21:00:00')
    },
    {
      id: 9,
      homeTeam: 'Lupi Selvaggi',
      awayTeam: 'Aquile Nere',
      homeScore: 3,
      awayScore: 1,
      status: 'Terminata',
      date: new Date('2026-03-20T21:00:00')
    },
    {
      id: 8,
      homeTeam: 'Pirati del Campo',
      awayTeam: 'Leoni FC',
      homeScore: 2,
      awayScore: 2,
      status: 'Terminata',
      date: new Date('2026-03-13T21:00:00')
    },
    {
      id: 7,
      homeTeam: 'Tigri Bianche',
      awayTeam: 'Squali Rossi',
      homeScore: 1,
      awayScore: 4,
      status: 'Terminata',
      date: new Date('2026-03-06T21:00:00')
    },
    {
      id: 5,
      homeTeam: 'Squali Rossi',
      awayTeam: 'Tigri Bianche',
      homeScore: 0,
      awayScore: 0,
      status: 'Programmata',
      date: new Date('2026-03-27T21:00:00')
    },
    {
      id: 1,
      homeTeam: 'Squali Rossi',
      awayTeam: 'Leoni FC',
      homeScore: 2,
      awayScore: 4,
      status: 'Terminata',
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
      status: 'Terminata',
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
      status: 'Terminata',
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
      status: 'Terminata',
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
      status: 'Terminata',
      date: new Date('2025-11-15T21:00:00')
    },
    {
      id: 102,
      homeTeam: 'Aquile Nere',
      awayTeam: 'Squali Rossi',
      homeScore: 0,
      awayScore: 2,
      status: 'Terminata',
      date: new Date('2025-05-10T21:00:00')
    },
    // Season 2024
    {
      id: 201,
      homeTeam: 'Squali Rossi',
      awayTeam: 'Lupi Selvaggi',
      homeScore: 4,
      awayScore: 1,
      status: 'Terminata',
      date: new Date('2024-12-20T21:00:00')
    },
    {
      id: 202,
      homeTeam: 'Tigri Bianche',
      awayTeam: 'Squali Rossi',
      homeScore: 2,
      awayScore: 2,
      status: 'Terminata',
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
    const programmable = this.matches()
      .filter(m => m.status === 'Programmata')
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    return programmable.length > 0 ? programmable[0] : null;
  }

  /**
   * Recupera l'ultima partita terminata (utilizzato per la card in home page).
   * @returns L'ultima partita completata o la prima disponibile se nessuna è terminata.
   */
  getLastMatch() {
    // Return the latest completed match for the home page card
    const completed = this.matches()
      .filter(m => m.status === 'Terminata')
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    return completed.length > 0 ? completed[0] : this.getMatches()()[0];
  }

  // --- API Methods ---

  /**
   * Carica l'elenco completo delle partite dal backend e aggiorna il segnale interno.
   * @returns Un Observable con l'array delle partite.
   */
  loadMatches() {
    return this.http.get<Match[]>(this.BASE_URL).pipe(
      tap(matches => this.matches.set(matches))
    );
  }

  /**
   * Crea una nuova partita nel sistema.
   * @param match I dati della partita (senza ID).
   * @returns Un Observable con la partita appena creata.
   */
  createMatch(match: Omit<Match, 'id'>) {
    return this.http.post<Match>(this.BASE_URL, match).pipe(
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
}
