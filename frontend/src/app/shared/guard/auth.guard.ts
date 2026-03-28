import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../service/auth.service';

/**
 * Guardia di navigazione che permette l'accesso solo agli utenti autenticati.
 * Se l'utente non è autenticato, viene reindirizzato alla pagina di login.
 */
export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Memorizza l'URL tentato per reindirizzamenti futuri (opzionale)
  return router.parseUrl('/login');
};
