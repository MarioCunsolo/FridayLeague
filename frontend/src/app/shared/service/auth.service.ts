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
    // Se c'è uno stato salvato dell'utente con la lega nel localStorage, lo carichiamo
    const savedUserLega = localStorage.getItem('mock_user_lega');
    if (savedUserLega) {
      this._currentUser.set(JSON.parse(savedUserLega));
    } else if (!this.getToken()) {
      // Se non c'è un utente loggato, impostiamo l'utente di default
      // Inizialmente NON appartiene a nessuna lega (legaId: null) per testare il reindirizzamento
      this._currentUser.set({
        id: 1,
        nome: 'Mario (Mock)',
        cognome: 'Cunsolo',
        email: 'mario@test.com',
        legaId: null
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

    // MOCK LOGIN SUCCESS - Inizialmente senza lega per far spuntare la pagina
    const mockResponse = {
      user: { 
        id: 1, 
        email: credentials.email || 'mario@test.com', 
        nome: 'Mario (Mock)', 
        cognome: 'Cunsolo',
        legaId: null
      },
      token: 'fake-jwt-token-development'
    };

    localStorage.setItem(this.TOKEN_KEY, mockResponse.token);
    localStorage.removeItem('mock_user_lega'); // Rimuoviamo eventuale lega precedente
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

    // MOCK REGISTER SUCCESS - Utente senza lega
    const mockResponse = {
      user: { 
        id: Date.now(), 
        email: userData.email, 
        nome: userData.nome, 
        cognome: userData.cognome,
        legaId: null
      },
      token: 'fake-jwt-token-development'
    };

    localStorage.setItem(this.TOKEN_KEY, mockResponse.token);
    localStorage.removeItem('mock_user_lega');
    this._currentUser.set(mockResponse.user);
    
    return of(mockResponse).pipe(delay(500));
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
    const user = this._currentUser();
    if (user) {
      const updatedUser = {
        ...user,
        legaId: 100, // ID fittizio per la nuova lega creata
        nomeLega: nomeLega,
        descrizioneLega: descrizione || '',
        ruoloLega: 'AMMINISTRATORE'
      };
      this._currentUser.set(updatedUser);
      localStorage.setItem('mock_user_lega', JSON.stringify(updatedUser));
    }
    return of({ success: true, message: 'Lega creata con successo' }).pipe(delay(600));
  }

  /**
   * Simula la partecipazione a una lega esistente tramite codice.
   */
  partecipaLega(codiceLega: string) {
    const user = this._currentUser();
    if (user) {
      const updatedUser = {
        ...user,
        legaId: 200, // ID fittizio per la lega a cui partecipa
        nomeLega: 'Lega del Venerdì',
        codiceLega: codiceLega,
        ruoloLega: 'GIOCATORE'
      };
      this._currentUser.set(updatedUser);
      localStorage.setItem('mock_user_lega', JSON.stringify(updatedUser));
    }
    return of({ success: true, message: 'Lega unita con successo' }).pipe(delay(600));
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
