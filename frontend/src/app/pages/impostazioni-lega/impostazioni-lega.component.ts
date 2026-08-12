import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { AuthService } from '../../shared/service/auth.service';
import { AuthorizationService } from '../../shared/service/authorization.service';

@Component({
  selector: 'app-impostazioni-lega',
  standalone: true,
  imports: [CommonModule, RouterLink, NzIconModule],
  templateUrl: './impostazioni-lega.component.html',
  styleUrls: ['./impostazioni-lega.component.scss']
})
export class ImpostazioniLegaComponent {
  public authService = inject(AuthService);
  private readonly authorization = inject(AuthorizationService);
  readonly activeLega = computed(() => {
    const user = this.authService.currentUser();
    return user?.legaId ? user.leghe.find(league => league.id === user.legaId) ?? null : null;
  });

  isAdminOrSuperAdmin(): boolean {
    return this.authorization.canViewActivityLog(this.authService.currentUser());
  }

}
