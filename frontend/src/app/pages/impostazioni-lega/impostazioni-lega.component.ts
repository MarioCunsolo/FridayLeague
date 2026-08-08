import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { AuthService } from '../../shared/service/auth.service';

@Component({
  selector: 'app-impostazioni-lega',
  standalone: true,
  imports: [CommonModule, RouterLink, NzIconModule],
  templateUrl: './impostazioni-lega.component.html',
  styleUrls: ['./impostazioni-lega.component.scss']
})
export class ImpostazioniLegaComponent {
  public authService = inject(AuthService);

  constructor() {
    console.log('DEBUG [ImpostazioniLega]: Current User:', this.authService.currentUser());
    console.log('DEBUG [ImpostazioniLega]: Active League:', this.getActiveLega());
  }

  isAdminOrSuperAdmin(): boolean {
    const user = this.authService.currentUser();
    if (!user || !user.legaId || !user.leghe) return false;
    const activeLega = user.leghe.find((l: any) => l.id === user.legaId);
    return activeLega && (activeLega.ruolo === 'SUPER_ADMIN' || activeLega.ruolo === 'ADMIN');
  }

  getActiveLega(): any {
    const user = this.authService.currentUser();
    if (!user || !user.legaId || !user.leghe) return null;
    return user.leghe.find((l: any) => l.id === user.legaId);
  }
}
