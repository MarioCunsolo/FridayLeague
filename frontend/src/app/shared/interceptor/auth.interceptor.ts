import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Intercettore HTTP che aggiunge automaticamente il token JWT agli header delle richieste.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Ottieni il token da localStorage o sessionStorage per supportare il "Ricordami"
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

  // Clona la richiesta per aggiungere il nuovo header
  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }

  return next(req);
};

