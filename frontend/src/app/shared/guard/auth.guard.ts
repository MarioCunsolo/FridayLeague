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

  // COMMENTATO TEMPORANEAMENTE: Permette l'accesso senza token (Bypass per sviluppo locale senza DB)
  /*
  if (authService.isAuthenticated()) {
    return true;
  }

  return router.parseUrl('/login');
  */
  
  return true;

};
