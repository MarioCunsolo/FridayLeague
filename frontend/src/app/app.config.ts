import { ApplicationConfig, LOCALE_ID, provideAppInitializer, inject } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling, withPreloading, PreloadAllModules } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideNzI18n, it_IT } from 'ng-zorro-antd/i18n';
import { routes } from './app.routes';
import { authInterceptor } from './shared/interceptor/auth.interceptor';
import { AuthService } from './shared/service/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
      withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    provideNzI18n(it_IT),
    provideAppInitializer(() => inject(AuthService).initSession()),
    { provide: LOCALE_ID, useValue: 'it-IT' }
  ]
};
