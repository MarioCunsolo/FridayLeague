import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomepageComponent } from './shared/component/homepage/homepage.component';
import { ReservationComponent } from './shared/component/reservation/reservation.component';
import { MatchComponent } from './shared/component/match/match.component';
import { ProfileComponent } from './shared/component/profile/profile.component';

const routes: Routes = [
  { path: '', component: HomepageComponent },
  { path: 'prenotazioni', component: ReservationComponent },
  { path: 'partite', component: MatchComponent },
  { path: 'profilo', component: ProfileComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
