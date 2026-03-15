import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomepageComponent } from './shared/component/homepage/homepage.component';
import { ReservationComponent } from './shared/component/reservation/reservation.component';
import { MatchComponent } from './shared/component/match/match.component';
import { MatchDetailComponent } from './shared/component/match-detail/match-detail.component';

@NgModule({
  declarations: [
    AppComponent,
    HomepageComponent,
    ReservationComponent,
    MatchComponent,
    MatchDetailComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
