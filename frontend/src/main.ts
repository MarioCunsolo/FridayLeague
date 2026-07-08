import { importProvidersFrom, LOCALE_ID, APP_INITIALIZER } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './app/shared/interceptor/auth.interceptor';
import { AppComponent } from './app/app.component';
import { AppRoutingModule } from './app/app-routing.module';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { it_IT, provideNzI18n } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import it from '@angular/common/locales/it';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AuthService } from './app/shared/service/auth.service';

registerLocaleData(it);

export function initializeApp(authService: AuthService) {
  return () => authService.initSession();
}

bootstrapApplication(AppComponent, {
    providers: [
      importProvidersFrom(BrowserModule, AppRoutingModule), 
      provideNzI18n(it_IT),
      provideAnimations(),
      provideHttpClient(withInterceptors([authInterceptor])),
      {
        provide: APP_INITIALIZER,
        useFactory: initializeApp,
        deps: [AuthService],
        multi: true
      },
      { provide: LOCALE_ID, useValue: 'it-IT' }
    ]
})
  .catch(err => console.error(err));
