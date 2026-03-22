import { importProvidersFrom, LOCALE_ID } from '@angular/core';
import { AppComponent } from './app/app.component';
import { AppRoutingModule } from './app/app-routing.module';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { it_IT, provideNzI18n } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import it from '@angular/common/locales/it';

import { provideAnimations } from '@angular/platform-browser/animations';

registerLocaleData(it);

bootstrapApplication(AppComponent, {
    providers: [
      importProvidersFrom(BrowserModule, AppRoutingModule), 
      provideNzI18n(it_IT),
      provideAnimations(),
      { provide: LOCALE_ID, useValue: 'it-IT' }
    ]
})
  .catch(err => console.error(err));
