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
    this._currentUser.set(null);
  }

  /**
   * Inizializza la sessione dell'utente caricando il suo profilo se è presente un token JWT.
   * Viene richiamato dall'APP_INITIALIZER all'avvio dell'applicazione.
   */
  initSession(): Promise<void> {
    const token = this.getToken();
    if (!token) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      this.getCurrentUser().subscribe({
        next: () => resolve(),
        error: (err) => {
          console.error('Impossibile caricare la sessione utente:', err);
          // Rimuove il token non valido per evitare tentativi futuri falliti
          localStorage.removeItem(this.TOKEN_KEY);
          sessionStorage.removeItem(this.TOKEN_KEY);
          localStorage.removeItem('mock_user_lega');
          sessionStorage.removeItem('mock_user_lega');
          this._currentUser.set(null);
          resolve();
        }
      });
    });
  }


  /**
   * Effettua il login dell'utente chiamando le API reali del backend.
   * @param credentials Oggetto contenente email, password e il checkbox remember.
   */
  login(credentials: any) {
    const remember = !!credentials.remember;
    return this.http.post<any>(`${this.BASE_URL}/login`, credentials).pipe(
      tap(response => {
        const storage = remember ? localStorage : sessionStorage;
        const otherStorage = remember ? sessionStorage : localStorage;

        // Rimuove da un eventuale storage alternativo per evitare duplicazioni o conflitti
        otherStorage.removeItem(this.TOKEN_KEY);
        otherStorage.removeItem('mock_user_lega');

        storage.setItem(this.TOKEN_KEY, response.token);
        storage.removeItem('mock_user_lega'); // Rimuoviamo eventuale lega precedente
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
        // Registrazione di default memorizza su localStorage
        sessionStorage.removeItem(this.TOKEN_KEY);
        sessionStorage.removeItem('mock_user_lega');

        localStorage.setItem(this.TOKEN_KEY, response.token);
        localStorage.removeItem('mock_user_lega');
        this._currentUser.set(response.user);
      })
    );
  }


  /**
   * Effettua il logout dell'utente corrente e pulisce lo stato locale (Signal, LocalStorage e SessionStorage).
   */
  logout() {
    this._currentUser.set(null);
    localStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem('mock_user_lega');
    sessionStorage.removeItem('mock_user_lega');
    return this.http.post<void>(`${this.BASE_URL}/logout`, {}).pipe(
      catchError(() => of(void 0)) // Ignora errori di logout se il token è già scaduto
    );
  }

  /**
   * Aggiorna i dati dell'utente attualmente loggato.
   */
  updateCurrentUser(user: any): void {
    this._currentUser.set(user);
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
   * Recupera il token salvato nel localStorage o sessionStorage.
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY) || sessionStorage.getItem(this.TOKEN_KEY);
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
