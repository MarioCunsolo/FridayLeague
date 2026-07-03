import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../service/auth.service';

/**
 * Guardia di navigazione che verifica se l'utente appartiene a una lega.
 * Se l'utente non ha una lega attiva, viene reindirizzato a '/seleziona-lega'.
 * Se l'utente ha già una lega attiva e cerca di accedere a '/seleziona-lega', viene reindirizzato a '/'.
 */
export const leagueGuard = (route: any, state: any) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentUser = authService.currentUser();
  const hasLeague = currentUser && currentUser.legaId !== null && currentUser.legaId !== undefined;
  const isTargetingSelectLeague = state.url.startsWith('/seleziona-lega');

  if (!hasLeague) {
    if (!isTargetingSelectLeague) {
      return router.parseUrl('/seleziona-lega');
    }
    return true; // Permetti l'accesso alla rotta di selezione lega
  } else {
    if (isTargetingSelectLeague) {
      return router.parseUrl('/'); // Se ha già una lega, torna alla home
    }
    return true; // Permetti l'accesso alla rotta richiesta
  }
};
