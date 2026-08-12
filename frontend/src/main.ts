import { registerLocaleData } from '@angular/common';
import it from '@angular/common/locales/it';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

registerLocaleData(it);

bootstrapApplication(AppComponent, appConfig)
  .catch(error => console.error('Impossibile avviare LineUp:', error));
