import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomepageComponent } from './pages/homepage/homepage.component';
import { ReservationComponent } from './pages/reservation/reservation.component';
import { MatchComponent } from './pages/match/match.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { LayoutComponent } from './shared/component/layout/layout.component';
import { LoginComponent } from './pages/login/login.component';
import { StatsComponent } from './pages/stats/stats.component';
import { authGuard } from './shared/guard/auth.guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: HomepageComponent },
      { path: 'prenotazioni', component: ReservationComponent },
      { path: 'calendario', component: MatchComponent },
      { path: 'profilo', component: ProfileComponent },
      { path: 'classifiche', component: StatsComponent },
    ]
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
