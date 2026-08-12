import { Routes } from '@angular/router';
import { HomepageComponent } from './pages/homepage/homepage.component';
import { LayoutComponent } from './shared/component/layout/layout.component';
import { adminOnlyGuard } from './shared/guard/admin-only.guard';
import { adminOrCoAdminGuard } from './shared/guard/admin-or-co-admin.guard';
import { authGuard } from './shared/guard/auth.guard';
import { leagueGuard } from './shared/guard/league.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent) },
  {
    path: 'seleziona-lega',
    canActivate: [authGuard, leagueGuard],
    loadComponent: () => import('./pages/seleziona-lega/seleziona-lega.component').then(m => m.SelezionaLegaComponent)
  },
  {
    path: '',
    canActivate: [authGuard, leagueGuard],
    // Il layout e la dashboard sono il percorso primario dopo l'autenticazione.
    // Restano eager per rendere atomica la prima navigazione post-login.
    component: LayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      { path: 'home', component: HomepageComponent },
      { path: 'prenotazioni', loadComponent: () => import('./pages/reservation/reservation.component').then(m => m.ReservationComponent) },
      { path: 'calendario', loadComponent: () => import('./pages/match/match.component').then(m => m.MatchComponent) },
      { path: 'profilo', loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent) },
      { path: 'classifiche', loadComponent: () => import('./pages/stats/stats.component').then(m => m.StatsComponent) },
      { path: 'account', loadComponent: () => import('./pages/account/account.component').then(m => m.AccountComponent) },
      {
        path: 'impostazioni',
        canActivate: [adminOrCoAdminGuard],
        children: [
          { path: '', pathMatch: 'full', loadComponent: () => import('./pages/impostazioni-lega/impostazioni-lega.component').then(m => m.ImpostazioniLegaComponent) },
          { path: 'partecipanti', loadComponent: () => import('./pages/impostazioni-lega/gestisci-partecipanti/gestisci-partecipanti.component').then(m => m.GestisciPartecipantiComponent) },
          { path: 'registro-attivita', canActivate: [adminOnlyGuard], loadComponent: () => import('./pages/impostazioni-lega/registro-attivita/registro-attivita.component').then(m => m.RegistroAttivitaComponent) }
        ]
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
