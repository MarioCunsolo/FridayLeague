import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { AuthorizationService } from '../service/authorization.service';

/**
 * Guardia di navigazione che permette l'accesso solo agli utenti con ruolo SUPER_ADMIN o ADMIN nella lega attiva.
 * Se l'utente non ha i permessi necessari, viene reindirizzato alla homepage.
 */
export const adminOnlyGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const authorization = inject(AuthorizationService);
  const router = inject(Router);

  if (authorization.canViewActivityLog(authService.currentUser())) {
    return true;
  }

  console.warn('Accesso negato: Solo il super admin o gli admin possono accedere a questa rotta.');
  return router.parseUrl('/home');
};
