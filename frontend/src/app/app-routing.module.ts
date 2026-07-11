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
import { RegistroAttivitaComponent } from './pages/impostazioni-lega/registro-attivita/registro-attivita.component';

import { adminOrCoAdminGuard } from './shared/guard/admin-or-co-admin.guard';
import { adminOnlyGuard } from './shared/guard/admin-only.guard';

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
        path: 'account',
        loadComponent: () => import('./pages/account/account.component').then(m => m.AccountComponent)
      },
      {
        path: 'impostazioni',
        canActivate: [adminOrCoAdminGuard],
        children: [
          { path: '', component: ImpostazioniLegaComponent },
          { path: 'partecipanti', component: GestisciPartecipantiComponent },
          { path: 'registro-attivita', component: RegistroAttivitaComponent, canActivate: [adminOnlyGuard] }
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
