import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService } from '../../../shared/service/auth.service';
import { LegaService } from '../../../shared/service/lega.service';

@Component({
  selector: 'app-registro-attivita',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NzTableModule,
    NzTagModule,
    NzIconModule,
    NzButtonModule,
    NzSpinModule,
    DatePipe
  ],
  templateUrl: './registro-attivita.component.html',
  styleUrls: ['./registro-attivita.component.scss']
})
export class RegistroAttivitaComponent implements OnInit {
  private authService = inject(AuthService);
  private legaService = inject(LegaService);
  private message = inject(NzMessageService);

  public logs = signal<any[]>([]);
  public loading = signal<boolean>(true);

  ngOnInit(): void {
    this.caricaRegistri();
  }

  caricaRegistri(): void {
    const user = this.authService.currentUser();
    if (user && user.legaId) {
      this.loading.set(true);
      this.legaService.getRegistroAttivita(user.legaId).subscribe({
        next: (data) => {
          this.logs.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Errore durante il caricamento del registro attività', err);
          this.message.error('Impossibile caricare il registro attività della lega.');
          this.loading.set(false);
        }
      });
    } else {
      this.loading.set(false);
    }
  }

  getActionBadgeColor(azione: string): string {
    switch (azione) {
      case 'CREAZIONE_LEGA':
        return '#722ed1'; // Viola regale per la creazione
      case 'ACCESSO_LEGA':
        return '#87d068'; // Verde successo per gli ingressi
      case 'CAMBIO_RUOLO':
        return '#2db7f5'; // Azzurro info per i ruoli
      case 'RIMOZIONE_UTENTE':
        return '#f50'; // Rosso pericolo per espulsioni
      default:
        return '#8c8c8c'; // Grigio di default
    }
  }

  getActionText(azione: string): string {
    switch (azione) {
      case 'CREAZIONE_LEGA':
        return 'Creazione Lega';
      case 'ACCESSO_LEGA':
        return 'Nuovo Ingresso';
      case 'CAMBIO_RUOLO':
        return 'Modifica Ruolo';
      case 'RIMOZIONE_UTENTE':
        return 'Rimozione Utente';
      default:
        return azione;
    }
  }

  getRoleBadgeColor(ruolo: string): string {
    switch (ruolo) {
      case 'SUPER_ADMIN':
        return '#722ed1';
      case 'ADMIN':
        return '#f50';
      case 'CO_ADMIN':
        return '#2db7f5';
      default:
        return '#87d068';
    }
  }
}
