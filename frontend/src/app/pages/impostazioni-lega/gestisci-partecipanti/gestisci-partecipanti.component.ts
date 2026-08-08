import { Component, OnInit, inject, signal, ViewContainerRef } from '@angular/core';
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
    NzSpinModule
  ],
  templateUrl: './gestisci-partecipanti.component.html',
  styleUrls: ['./gestisci-partecipanti.component.scss']
})
export class GestisciPartecipantiComponent implements OnInit {
  private authService = inject(AuthService);
  private legaService = inject(LegaService);
  private message = inject(NzMessageService);
  private viewContainerRef = inject(ViewContainerRef);

  public partecipanti = signal<any[]>([]);
  public loading = signal<boolean>(true);
  public actionLoading = signal<boolean>(false);

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
    
    // Nessuno può gestire il SUPER_ADMIN
    if (item.ruolo === 'SUPER_ADMIN') return false;

    // Se l'utente corrente è SUPER_ADMIN, può gestire chiunque altro (ADMIN, CO_ADMIN, GIOCATORE)
    if (currentUserRole === 'SUPER_ADMIN') return true;

    // Se l'utente corrente è ADMIN, può gestire solo i CO_ADMIN e i GIOCATORE semplici (non può gestire altri ADMIN o il SUPER_ADMIN)
    if (currentUserRole === 'ADMIN') {
      return item.ruolo === 'CO_ADMIN' || item.ruolo === 'GIOCATORE';
    }

    // Se l'utente corrente è CO_ADMIN, può gestire solo i GIOCATORE semplici
    if (currentUserRole === 'CO_ADMIN') {
      return item.ruolo === 'GIOCATORE';
    }

    return false;
  }

  /**
   * Crea ed apre la modale di conferma programmaticamente.
   */
  private openConfirmModal(options: {
    title: string;
    message: string;
    confirmText: string;
    isDanger: boolean;
    onConfirm: () => void;
  }): void {
    const componentRef = this.viewContainerRef.createComponent(ConfirmModalComponent);
    
    componentRef.instance.isVisible = true;
    componentRef.instance.title = options.title;
    componentRef.instance.message = options.message;
    componentRef.instance.confirmText = options.confirmText;
    componentRef.instance.isDanger = options.isDanger;

    // Sottoscrizione all'evento di conferma
    const confirmSub = componentRef.instance.confirm.subscribe(() => {
      options.onConfirm();
      confirmSub.unsubscribe();
      cancelSub.unsubscribe();
      componentRef.destroy();
    });

    // Sottoscrizione all'evento di annullamento
    const cancelSub = componentRef.instance.cancel.subscribe(() => {
      confirmSub.unsubscribe();
      cancelSub.unsubscribe();
      componentRef.destroy();
    });
  }

  chiediConfermaCambioRuolo(item: any, nuovoRuolo: string): void {
    let title = '';
    let message = '';
    let confirmText = '';
    let isDanger = false;

    if (nuovoRuolo === 'ADMIN') {
      title = 'Promuovi a Admin';
      message = `Sei sicuro di voler promuovere ${item.nome} ${item.cognome} ad ADMIN della lega? Questa azione gli assegnerà i privilegi massimi.`;
      confirmText = 'Rendi Admin';
      isDanger = true;
    } else if (nuovoRuolo === 'CO_ADMIN') {
      title = 'Promuovi a Co-Admin';
      message = `Sei sicuro di voler promuovere ${item.nome} ${item.cognome} a Co-Admin della lega?`;
      confirmText = 'Rendi Co-Admin';
      isDanger = false;
    } else if (nuovoRuolo === 'GIOCATORE') {
      title = 'Declassa a Giocatore';
      message = `Sei sicuro di voler declassare ${item.nome} ${item.cognome} a Giocatore semplice?`;
      confirmText = 'Rendi Giocatore';
      isDanger = true;
    }

    this.openConfirmModal({
      title,
      message,
      confirmText,
      isDanger,
      onConfirm: () => this.eseguiCambioRuolo(item, nuovoRuolo)
    });
  }

  chiediConfermaRimozione(item: any): void {
    this.openConfirmModal({
      title: 'Rimuovi Partecipante',
      message: `Sei sicuro di voler rimuovere definitivamente ${item.nome} ${item.cognome} da questa lega?`,
      confirmText: 'Rimuovi',
      isDanger: true,
      onConfirm: () => this.rimuoviPartecipante(item)
    });
  }

  eseguiCambioRuolo(item: any, nuovoRuolo: string): void {
    const user = this.authService.currentUser();
    if (!user || !user.legaId || !this.canManage(item)) return;

    // Controllo di sicurezza client-side: Solo SUPER_ADMIN e ADMIN possono modificare i ruoli
    const ruoloUtente = this.getCurrentUserRole();
    if (ruoloUtente !== 'SUPER_ADMIN' && ruoloUtente !== 'ADMIN') {
      this.message.error('Solo il super admin o gli admin della lega possono modificare i ruoli.');
      return;
    }

    this.actionLoading.set(true);

    this.legaService.cambiaRuoloPartecipante(user.legaId, item.userId, nuovoRuolo).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.message.success(`Ruolo di ${item.nome} aggiornato in ${nuovoRuolo} con successo!`);
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

    // Controllo di sicurezza client-side: Solo SUPER_ADMIN, ADMIN e CO_ADMIN possono rimuovere
    const ruoloUtente = this.getCurrentUserRole();
    if (ruoloUtente !== 'SUPER_ADMIN' && ruoloUtente !== 'ADMIN' && ruoloUtente !== 'CO_ADMIN') {
      this.message.error('Non hai i permessi per rimuovere partecipanti da questa lega.');
      return;
    }

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
      case 'SUPER_ADMIN':
        return '#722ed1'; // Viola premium
      case 'ADMIN':
        return '#f50'; // Rosso
      case 'CO_ADMIN':
        return '#2db7f5'; // Azzurro
      default:
        return '#87d068'; // Verde
    }
  }
}
