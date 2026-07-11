import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../service/auth.service';

/**
 * Guardia di navigazione che permette l'accesso solo agli utenti con ruolo SUPER_ADMIN o ADMIN nella lega attiva.
 * Se l'utente non ha i permessi necessari, viene reindirizzato alla homepage.
 */
export const adminOnlyGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUser();
  if (user && user.legaId && user.leghe) {
    const activeLega = user.leghe.find((l: any) => l.id === user.legaId);
    if (activeLega && (activeLega.ruolo === 'SUPER_ADMIN' || activeLega.ruolo === 'ADMIN')) {
      return true;
    }
  }

  console.warn('Accesso negato: Solo il super admin o gli admin possono accedere a questa rotta.');
  return router.parseUrl('/home');
};
