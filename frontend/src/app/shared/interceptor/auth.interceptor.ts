import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * Intercettore HTTP che aggiunge automaticamente il token JWT agli header delle richieste.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Non inviare mai il token a host esterni (font, CDN, analytics, ecc.).
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

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
