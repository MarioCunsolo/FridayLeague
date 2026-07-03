import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, catchError, of, delay, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private readonly BASE_URL = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'auth_token';

  private _currentUser = signal<any>(null); // Sostituire any con l'interfaccia User
  public currentUser = this._currentUser.asReadonly();

  public isAuthenticated = computed(() => !!this.getToken());

  constructor() {
    const token = this.getToken();
    if (token) {
      this.getCurrentUser().subscribe({
        error: (err) => {
          console.error('Session load failed. Logging out.', err);
          this.logout().subscribe();
        }
      });
    } else {
      this._currentUser.set(null);
    }
  }


  /**
   * Effettua il login dell'utente chiamando le API reali del backend.
   * @param credentials Oggetto contenente email e password.
   */
  login(credentials: any) {
    return this.http.post<any>(`${this.BASE_URL}/login`, credentials).pipe(
      tap(response => {
        localStorage.setItem(this.TOKEN_KEY, response.token);
        localStorage.removeItem('mock_user_lega'); // Rimuoviamo eventuale lega precedente
        this._currentUser.set(response.user);
      })
    );
  }

  /**
   * Registra un nuovo utente chiamando le API reali del backend.
   * @param userData Oggetto contenente nome, cognome, email e password.
   */
  register(userData: any) {
    return this.http.post<any>(`${this.BASE_URL}/register`, userData).pipe(
      tap(response => {
        localStorage.setItem(this.TOKEN_KEY, response.token);
        localStorage.removeItem('mock_user_lega');
        this._currentUser.set(response.user);
      })
    );
  }


  /**
   * Effettua il logout dell'utente corrente e pulisce lo stato locale (Signal e LocalStorage).
   */
  logout() {
    this._currentUser.set(null);
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem('mock_user_lega');
    return this.http.post<void>(`${this.BASE_URL}/logout`, {}).pipe(
      catchError(() => of(void 0)) // Ignora errori di logout se il token è già scaduto
    );
  }

  /**
   * Simula la creazione di una nuova lega da parte dell'utente.
   */
  creaLega(nomeLega: string, descrizione?: string) {
    let user = this._currentUser();
    if (!user) {
      // Fallback difensivo se l'utente dovesse essere null
      user = {
        id: 1,
        nome: 'Mario (Mock)',
        cognome: 'Cunsolo',
        email: 'mario@test.com',
        legaId: null,
        leghe: []
      };
    }
    const nuovaLegaId = Date.now();
    const nuovaLega = { id: nuovaLegaId, nome: nomeLega, ruolo: 'AMMINISTRATORE' };
    
    // Prepariamo l'elenco includendo due leghe mock per testare lo switcher
    const nuoveLeghe = [
      nuovaLega,
      { id: 1001, nome: 'Lega Calcio 8 (Mock)', ruolo: 'GIOCATORE' },
      { id: 1002, nome: 'Champions Friday (Mock)', ruolo: 'GIOCATORE' }
    ];

    const updatedUser = {
      ...user,
      legaId: nuovaLegaId, // Imposta questa lega come attiva
      nomeLega: nomeLega,
      leghe: nuoveLeghe
    };
    this._currentUser.set(updatedUser);
    localStorage.setItem('mock_user_lega', JSON.stringify(updatedUser));
    return of({ success: true, message: 'Lega creata con successo' }).pipe(delay(600));
  }

  /**
   * Simula la partecipazione a una lega esistente tramite codice.
   */
  partecipaLega(codiceLega: string) {
    let user = this._currentUser();
    if (!user) {
      // Fallback difensivo se l'utente dovesse essere null
      user = {
        id: 1,
        nome: 'Mario (Mock)',
        cognome: 'Cunsolo',
        email: 'mario@test.com',
        legaId: null,
        leghe: []
      };
    }
    const nuovaLegaId = Date.now();
    const nomeLega = 'Lega ' + codiceLega.toUpperCase();
    const nuovaLega = { id: nuovaLegaId, nome: nomeLega, ruolo: 'GIOCATORE' };

    // Prepariamo l'elenco includendo due leghe mock per testare lo switcher
    const nuoveLeghe = [
      nuovaLega,
      { id: 1001, nome: 'Lega Calcio 8 (Mock)', ruolo: 'GIOCATORE' },
      { id: 1002, nome: 'Champions Friday (Mock)', ruolo: 'GIOCATORE' }
    ];

    const updatedUser = {
      ...user,
      legaId: nuovaLegaId, // Imposta questa lega come attiva
      nomeLega: nomeLega,
      leghe: nuoveLeghe
    };
    this._currentUser.set(updatedUser);
    localStorage.setItem('mock_user_lega', JSON.stringify(updatedUser));
    return of({ success: true, message: 'Lega unita con successo' }).pipe(delay(600));
  }

  /**
   * Cambia la lega attualmente attiva selezionata dall'utente.
   */
  cambiaLega(idLega: number) {
    const user = this._currentUser();
    if (user && user.leghe) {
      const legaTrovata = user.leghe.find((l: any) => l.id === idLega);
      if (legaTrovata) {
        const updatedUser = {
          ...user,
          legaId: legaTrovata.id,
          nomeLega: legaTrovata.nome
        };
        this._currentUser.set(updatedUser);
        localStorage.setItem('mock_user_lega', JSON.stringify(updatedUser));
      }
    }
  }

  /**
   * Recupera il token salvato nel localStorage.
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Recupera i dati dell'utente attualmente autenticato (utilizzato al refresh della pagina).
   * @returns Un Observable con i dati dell'utente.
   */
  getCurrentUser() {
    return this.http.get<any>(`${this.BASE_URL}/current-user`).pipe(
      tap(user => this._currentUser.set(user))
    );
  }
}
