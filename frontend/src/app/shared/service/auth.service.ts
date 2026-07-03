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
    } else {
      // Se non c'è una lega salvata, impostiamo comunque l'utente di default
      // (anche se ha già un token nel browser) così da evitare che l'oggetto _currentUser sia null
      // Inizialmente NON appartiene a nessuna lega (legaId: null, leghe: []) per testare il reindirizzamento
      this._currentUser.set({
        id: 1,
        nome: 'Mario (Mock)',
        cognome: 'Cunsolo',
        email: 'mario@test.com',
        legaId: null,
        leghe: []
      });
    }
  }


  /**
   * Effettua il login dell'utente simulando il successo (bypass API backend).
   * @param credentials Oggetto contenente email e password.
   */
  login(credentials: any) {
    // MOCK LOGIN SUCCESS - Inizialmente senza lega per far spuntare la pagina
    const mockResponse = {
      user: { 
        id: 1, 
        email: credentials.email || 'mario@test.com', 
        nome: 'Mario (Mock)', 
        cognome: 'Cunsolo',
        legaId: null,
        leghe: []
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
    // MOCK REGISTER SUCCESS - Utente senza lega
    const mockResponse = {
      user: { 
        id: Date.now(), 
        email: userData.email, 
        nome: userData.nome, 
        cognome: userData.cognome,
        legaId: null,
        leghe: []
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
