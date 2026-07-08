import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService } from '../../../shared/service/auth.service';
import { LegaService } from '../../../shared/service/lega.service';
import { ConfirmModalComponent } from '../../../shared/component/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-gestisci-partecipanti',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    NzTableModule, 
    NzTagModule, 
    NzIconModule, 
    NzButtonModule, 
    NzSpinModule,
    ConfirmModalComponent
  ],
  templateUrl: './gestisci-partecipanti.component.html',
  styleUrls: ['./gestisci-partecipanti.component.css']
})
export class GestisciPartecipantiComponent implements OnInit {
  private authService = inject(AuthService);
  private legaService = inject(LegaService);
  private message = inject(NzMessageService);

  public partecipanti = signal<any[]>([]);
  public loading = signal<boolean>(true);
  public actionLoading = signal<boolean>(false);

  // Stato per la modale di conferma riutilizzabile
  public isConfirmModalVisible = signal<boolean>(false);
  public confirmModalTitle = signal<string>('');
  public confirmModalMessage = signal<string>('');
  public confirmModalConfirmText = signal<string>('');
  public confirmModalIsDanger = signal<boolean>(false);
  private activeConfirmAction: (() => void) | null = null;

  ngOnInit(): void {
    this.caricaPartecipanti();
  }

  caricaPartecipanti(): void {
    const user = this.authService.currentUser();
    if (user && user.legaId) {
      this.loading.set(true);
      this.legaService.getLegaPartecipanti(user.legaId).subscribe({
        next: (data) => {
          this.partecipanti.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Errore durante il recupero dei partecipanti', err);
          this.message.error('Impossibile caricare i partecipanti della lega.');
          this.loading.set(false);
        }
      });
    } else {
      this.loading.set(false);
    }
  }

  getCurrentUserId(): number {
    return this.authService.currentUser()?.id || 0;
  }

  getCurrentUserRole(): string {
    const user = this.authService.currentUser();
    if (!user || !user.legaId || !user.leghe) return 'GIOCATORE';
    const activeLega = user.leghe.find((l: any) => l.id === user.legaId);
    return activeLega ? activeLega.ruolo : 'GIOCATORE';
  }

  canManage(item: any): boolean {
    const currentUserId = this.getCurrentUserId();
    const currentUserRole = this.getCurrentUserRole();

    // Non puoi autogestirti
    if (item.userId === currentUserId) return false;
    
    // Nessuno può gestire l'ADMIN
    if (item.ruolo === 'ADMIN') return false;

    // Se l'utente corrente è ADMIN, può gestire chiunque altro (CO_ADMIN o GIOCATORE)
    if (currentUserRole === 'ADMIN') return true;

    // Se l'utente corrente è CO_ADMIN, può gestire solo i GIOCATORE semplici
    if (currentUserRole === 'CO_ADMIN') {
      return item.ruolo === 'GIOCATORE';
    }

    return false;
  }

  chiediConfermaRuolo(item: any): void {
    const isPromoting = item.ruolo === 'GIOCATORE';
    this.confirmModalTitle.set(isPromoting ? 'Promuovi a Co-Admin' : 'Declassa a Giocatore');
    this.confirmModalMessage.set(
      isPromoting 
        ? `Sei sicuro di voler promuovere ${item.nome} ${item.cognome} a Co-Admin della lega?` 
        : `Sei sicuro di voler rimuovere i privilegi di Co-Admin a ${item.nome} ${item.cognome}?`
    );
    this.confirmModalConfirmText.set(isPromoting ? 'Promuovi' : 'Declassa');
    this.confirmModalIsDanger.set(!isPromoting);
    this.activeConfirmAction = () => this.toggleRuolo(item);
    this.isConfirmModalVisible.set(true);
  }

  chiediConfermaRimozione(item: any): void {
    this.confirmModalTitle.set('Rimuovi Partecipante');
    this.confirmModalMessage.set(`Sei sicuro di voler rimuovere definitivamente ${item.nome} ${item.cognome} da questa lega?`);
    this.confirmModalConfirmText.set('Rimuovi');
    this.confirmModalIsDanger.set(true);
    this.activeConfirmAction = () => this.rimuoviPartecipante(item);
    this.isConfirmModalVisible.set(true);
  }

  eseguiAzioneConfermata(): void {
    if (this.activeConfirmAction) {
      this.activeConfirmAction();
    }
    this.chiudiModale();
  }

  chiudiModale(): void {
    this.isConfirmModalVisible.set(false);
    this.activeConfirmAction = null;
  }

  toggleRuolo(item: any): void {
    const user = this.authService.currentUser();
    if (!user || !user.legaId || !this.canManage(item)) return;

    const nuovoRuolo = item.ruolo === 'CO_ADMIN' ? 'GIOCATORE' : 'CO_ADMIN';
    this.actionLoading.set(true);

    this.legaService.cambiaRuoloPartecipante(user.legaId, item.userId, nuovoRuolo).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.message.success(`Ruolo di ${item.nome} aggiornato con successo!`);
        this.caricaPartecipanti();
      },
      error: (err) => {
        this.actionLoading.set(false);
        console.error(err);
        this.message.error('Errore durante l\'aggiornamento del ruolo.');
      }
    });
  }

  rimuoviPartecipante(item: any): void {
    const user = this.authService.currentUser();
    if (!user || !user.legaId || !this.canManage(item)) return;

    this.actionLoading.set(true);
    this.legaService.rimuoviPartecipante(user.legaId, item.userId).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.message.success(`${item.nome} rimosso dalla lega.`);
        this.caricaPartecipanti();
      },
      error: (err) => {
        this.actionLoading.set(false);
        console.error(err);
        this.message.error('Errore durante la rimozione del partecipante.');
      }
    });
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
