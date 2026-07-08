import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomepageComponent } from './pages/homepage/homepage.component';
import { ReservationComponent } from './pages/reservation/reservation.component';
import { MatchComponent } from './pages/match/match.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { LayoutComponent } from './shared/component/layout/layout.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { StatsComponent } from './pages/stats/stats.component';
import { SelezionaLegaComponent } from './pages/seleziona-lega/seleziona-lega.component';
import { authGuard } from './shared/guard/auth.guard';
import { leagueGuard } from './shared/guard/league.guard';
import { ImpostazioniLegaComponent } from './pages/impostazioni-lega/impostazioni-lega.component';
import { GestisciPartecipantiComponent } from './pages/impostazioni-lega/gestisci-partecipanti/gestisci-partecipanti.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'seleziona-lega',
    component: SelezionaLegaComponent,
    canActivate: [authGuard, leagueGuard]
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard, leagueGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: HomepageComponent },
      { path: 'prenotazioni', component: ReservationComponent },
      { path: 'calendario', component: MatchComponent },
      { path: 'profilo', component: ProfileComponent },
      { path: 'classifiche', component: StatsComponent },
      {
        path: 'impostazioni',
        children: [
          { path: '', component: ImpostazioniLegaComponent },
          { path: 'partecipanti', component: GestisciPartecipantiComponent }
        ]
      }
    ]
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
