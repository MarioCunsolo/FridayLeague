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

  // BYPASS TEMPORANEO: Ritorna sempre true per permettere lo sviluppo senza backend
  public isAuthenticated = computed(() => true || !!this.getToken());

  constructor() {
    // Se non c'è un utente loggato (es. al refresh o dopo logout in modalità mock), 
    // impostiamo un utente di default per evitare errori nei componenti.
    if (!this.getToken()) {
      this._currentUser.set({
        id: 1,
        nome: 'Mario (Mock)',
        cognome: 'Cunsolo',
        email: 'mario@test.com'
      });
    }
  }


  /**
   * Effettua il login dell'utente simulando il successo (bypass API backend).
   * @param credentials Oggetto contenente email e password.
   */
  login(credentials: any) {
    // CODICE COMMENTATO TEMPORANEAMENTE (Sostituito da mock):
    /*
    return this.http.post<{ user: any, token: string }>(`${this.BASE_URL}/login`, credentials).pipe(
      tap(response => {
        localStorage.setItem(this.TOKEN_KEY, response.token);
        this._currentUser.set(response.user);
      })
    );
    */

    // MOCK LOGIN SUCCESS
    const mockResponse = {
      user: { id: 1, email: credentials.email || 'mario@test.com', nome: 'Mario (Mock)', cognome: 'Cunsolo' },
      token: 'fake-jwt-token-development'
    };

    localStorage.setItem(this.TOKEN_KEY, mockResponse.token);
    this._currentUser.set(mockResponse.user);
    
    return of(mockResponse).pipe(delay(500));
  }

  /**
   * Registra un nuovo utente simulando il successo (bypass API backend).
   * @param userData Oggetto contenente nome, cognome, email e password.
   */
  register(userData: any) {
    // CODICE COMMENTATO TEMPORANEAMENTE (Sostituito da mock):
    /*
    return this.http.post<{ user: any, token: string }>(`${this.BASE_URL}/register`, userData).pipe(
      tap(response => {
        localStorage.setItem(this.TOKEN_KEY, response.token);
        this._currentUser.set(response.user);
      })
    );
    */

    // MOCK REGISTER SUCCESS
    const mockResponse = {
      user: { id: Date.now(), email: userData.email, nome: userData.nome, cognome: userData.cognome },
      token: 'fake-jwt-token-development'
    };

    localStorage.setItem(this.TOKEN_KEY, mockResponse.token);
    this._currentUser.set(mockResponse.user);
    
    return of(mockResponse).pipe(delay(500));
  }


  /**
   * Effettua il logout dell'utente corrente e pulisce lo stato locale (Signal e LocalStorage).
   */
  logout() {
    this._currentUser.set(null);
    localStorage.removeItem(this.TOKEN_KEY);
    return this.http.post<void>(`${this.BASE_URL}/logout`, {}).pipe(
      catchError(() => of(void 0)) // Ignora errori di logout se il token è già scaduto
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
