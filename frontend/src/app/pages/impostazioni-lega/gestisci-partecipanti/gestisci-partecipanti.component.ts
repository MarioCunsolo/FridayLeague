import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { AuthService } from '../../../shared/service/auth.service';

@Component({
  selector: 'app-gestisci-partecipanti',
  standalone: true,
  imports: [CommonModule, RouterLink, NzTableModule, NzTagModule, NzIconModule, NzButtonModule, NzSpinModule],
  templateUrl: './gestisci-partecipanti.component.html',
  styleUrls: ['./gestisci-partecipanti.component.css']
})
export class GestisciPartecipantiComponent implements OnInit {
  private authService = inject(AuthService);

  public partecipanti = signal<any[]>([]);
  public loading = signal<boolean>(true);

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user && user.legaId) {
      this.authService.getLegaPartecipanti(user.legaId).subscribe({
        next: (data) => {
          this.partecipanti.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Errore durante il recupero dei partecipanti', err);
          this.loading.set(false);
        }
      });
    } else {
      this.loading.set(false);
    }
  }

  getRoleColor(ruolo: string): string {
    switch (ruolo) {
      case 'ADMIN':
        return '#f50'; // Red
      case 'CO_ADMIN':
        return '#2db7f5'; // Blue
      default:
        return '#87d068'; // Green
    }
  }
}
