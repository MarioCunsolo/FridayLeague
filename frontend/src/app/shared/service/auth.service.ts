import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, catchError, of } from 'rxjs';
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

  /**
   * Effettua il login dell'utente inviando le credenziali al server.
   * Salva il token ricevuto nel localStorage.
   * @param credentials Oggetto contenente email e password.
   */
  login(credentials: any) {
    return this.http.post<{user: any, token: string}>(`${this.BASE_URL}/login`, credentials).pipe(
      tap(response => {
        localStorage.setItem(this.TOKEN_KEY, response.token);
        this._currentUser.set(response.user);
      })
    );
  }

  /**
   * Registra un nuovo utente nel sistema.
   * @param userData Oggetto contenente nome, cognome, email e password.
   */
  register(userData: any) {
    return this.http.post<{user: any, token: string}>(`${this.BASE_URL}/register`, userData).pipe(
      tap(response => {
        localStorage.setItem(this.TOKEN_KEY, response.token);
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
