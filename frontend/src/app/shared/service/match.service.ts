import { Injectable, signal, computed } from '@angular/core';
import { Match, Player } from '../../models/interface/match.interface';

@Injectable({
  providedIn: 'root'
})
export class MatchService {
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

  getAvailableSeasons() {
    return ['2024', '2025', '2026'];
  }

  getMatches() {
    return computed(() => [...this.matches()].sort((a, b) => b.date.getTime() - a.date.getTime()));
  }

  getMatchById(id: number) {
    return this.matches().find(m => m.id === id);
  }

  getNextMatch() {
    const programmable = this.matches()
      .filter(m => m.status === 'Programmata')
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    return programmable.length > 0 ? programmable[0] : null;
  }

  getLastMatch() {
    // Return the latest completed match for the home page card
    const completed = this.matches()
      .filter(m => m.status === 'Terminata')
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    return completed.length > 0 ? completed[0] : this.getMatches()()[0];
  }
}
