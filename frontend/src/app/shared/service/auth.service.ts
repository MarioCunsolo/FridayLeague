import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private readonly BASE_URL = `${environment.apiUrl}/auth`;

  private _currentUser = signal<any>(null); // Replace any with User interface if available
  public currentUser = this._currentUser.asReadonly();

  /**
   * Effettua il login dell'utente inviando le credenziali al server.
   * @param credentials Oggetto contenente email e password.
   * @returns Un Observable con l'oggetto User se il login ha successo.
   */
  login(credentials: any) {
    return this.http.post<any>(`${this.BASE_URL}/login`, credentials).pipe(
      tap(user => this._currentUser.set(user))
    );
  }

  /**
   * Effettua il logout dell'utente corrente e pulisce lo stato locale.
   * @returns Un Observable di tipo void.
   */
  logout() {
    this._currentUser.set(null);
    return this.http.post<void>(`${this.BASE_URL}/logout`, {});
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
