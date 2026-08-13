import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, firstValueFrom, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  LoginRequest,
  RegistrationPendingResponse,
  RegisterRequest,
  ResendVerificationRequest,
  UpdateProfileRequest,
  UserDto,
  VerifyEmailRequest,
  VerifyEmailResponse
} from '../../models/api/auth.models';
import { Theme } from '../../models/api/core.models';
import { AuthorizationService } from './authorization.service';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly authorization = inject(AuthorizationService);
  private readonly baseUrl = `${environment.apiUrl}/auth`;
  private readonly currentUserState = signal<UserDto | null>(null);

  readonly currentUser = this.currentUserState.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isAdminOrCoAdmin = computed(() => this.authorization.canAccessLeagueSettings(this.currentUser()));
  readonly isAdminOrSuperAdmin = computed(() => this.authorization.canViewActivityLog(this.currentUser()));

  async initSession(): Promise<void> {
    if (!this.tokenStorage.getToken()) return;
    try {
      await firstValueFrom(this.getCurrentUser());
    } catch {
      // Un 401 implica token non utilizzabile; un errore di rete viene trattato ugualmente
      // come sessione non ripristinabile, evitando guardie in uno stato ambiguo.
      this.tokenStorage.clear();
      this.currentUserState.set(null);
    }
  }

  login(credentials: LoginRequest) {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, credentials).pipe(
      tap(response => this.persistAuthentication(response, credentials.remember))
    );
  }

  register(request: RegisterRequest) {
    return this.http.post<RegistrationPendingResponse>(`${this.baseUrl}/register`, request);
  }

  verifyEmail(request: VerifyEmailRequest) {
    return this.http.post<VerifyEmailResponse>(`${this.baseUrl}/verify-email`, request);
  }

  resendVerification(request: ResendVerificationRequest) {
    return this.http.post<RegistrationPendingResponse>(`${this.baseUrl}/resend-verification`, request);
  }

  logout() {
    this.currentUserState.set(null);
    this.tokenStorage.clear();
    return this.http.post<void>(`${this.baseUrl}/logout`, {}).pipe(catchError(() => of(void 0)));
  }

  updateCurrentUser(user: UserDto): void {
    this.currentUserState.set(user);
  }

  cambiaTema(tema: Theme) {
    return this.http.post<UserDto>(`${this.baseUrl}/cambia-tema`, { tema }).pipe(tap(user => this.updateCurrentUser(user)));
  }

  aggiornaProfilo(request: UpdateProfileRequest) {
    return this.http.post<UserDto>(`${this.baseUrl}/aggiorna-profilo`, request).pipe(tap(user => this.updateCurrentUser(user)));
  }

  cambiaPassword(password: string) {
    return this.http.post<void>(`${this.baseUrl}/cambia-password`, { password });
  }

  getToken(): string | null {
    return this.tokenStorage.getToken();
  }

  getCurrentUser() {
    return this.http.get<UserDto>(`${this.baseUrl}/current-user`).pipe(tap(user => this.updateCurrentUser(user)));
  }

  private persistAuthentication(response: AuthResponse, remember: boolean): void {
    this.tokenStorage.saveToken(response.token, remember);
    this.currentUserState.set(response.user);
  }
}
