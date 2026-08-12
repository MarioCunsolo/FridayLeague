import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { AuthorizationService } from '../service/authorization.service';

/**
 * Guardia di navigazione che permette l'accesso solo agli utenti con ruolo ADMIN o CO_ADMIN nella lega attiva.
 * Se l'utente non ha i permessi necessari, viene reindirizzato alla homepage.
 */
export const adminOrCoAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const authorization = inject(AuthorizationService);
  const router = inject(Router);

  if (authorization.canAccessLeagueSettings(authService.currentUser())) {
    return true;
  }

  console.warn('Accesso negato: Solo gli amministratori o co-amministratori possono accedere a questa rotta.');
  return router.parseUrl('/home');
};
