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

  public isAdminOrCoAdmin = computed(() => {
    const user = this.currentUser();
    if (!user || !user.legaId || !user.leghe) return false;
    const activeLega = user.leghe.find((l: any) => l.id === user.legaId);
    return activeLega && (activeLega.ruolo === 'ADMIN' || activeLega.ruolo === 'CO_ADMIN');
  });

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
  /**
   * Crea una nuova lega nel backend.
   */
  creaLega(nomeLega: string, descrizione?: string) {
    return this.http.post<any>(`${this.BASE_URL}/crea-lega`, { nomeLega, descrizione }).pipe(
      tap(user => {
        this._currentUser.set(user);
      })
    );
  }

  /**
   * Simula la partecipazione a una lega esistente tramite codice.
   */
  /**
   * Partecipa ad una lega esistente tramite codice.
   */
  partecipaLega(codiceLega: string) {
    return this.http.post<any>(`${this.BASE_URL}/partecipa-lega`, { codiceLega }).pipe(
      tap(user => {
        this._currentUser.set(user);
      })
    );
  }

  /**
   * Cambia la lega attualmente attiva selezionata dall'utente.
   */
  /**
   * Cambia la lega attualmente attiva.
   */
  cambiaLega(idLega: number) {
    this.http.post<any>(`${this.BASE_URL}/cambia-lega`, { idLega }).subscribe({
      next: user => {
        this._currentUser.set(user);
      },
      error: err => {
        console.error('Errore durante il cambio della lega', err);
      }
    });
  }

  /**
   * Recupera la lista dei partecipanti di una lega.
   */
  getLegaPartecipanti(legaId: number) {
    return this.http.get<any[]>(`${this.BASE_URL}/lega/${legaId}/partecipanti`);
  }

  /**
   * Salva la preferenza del tema (light/dark) per l'utente corrente.
   */
  cambiaTema(tema: 'dark' | 'light') {
    return this.http.post<any>(`${this.BASE_URL}/cambia-tema`, { tema }).pipe(
      tap(user => this._currentUser.set(user))
    );
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
