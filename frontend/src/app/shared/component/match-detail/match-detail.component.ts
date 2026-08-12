import { Component, input, output, computed, signal, inject, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoalEvent, Match, MatchStatus } from '../../../models/interface/match.interface';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { AddGoalModalComponent } from './add-goal-modal/add-goal-modal.component';
import { SetupMatchModalComponent } from './setup-match-modal/setup-match-modal.component';
import { AddMatchModalComponent } from '../../../pages/match/add-match-modal/add-match-modal.component';
import { MatchFormData } from '../../../models/api/match.models';
import { MatchService } from '../../service/match.service';
import { AuthService } from '../../service/auth.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';

@Component({
    selector: 'app-match-detail',
    templateUrl: './match-detail.component.html',
    styleUrls: ['./match-detail.component.scss'],
    standalone: true,
    imports: [CommonModule, NzButtonModule, NzIconModule, AddGoalModalComponent, SetupMatchModalComponent, AddMatchModalComponent]
})
export class MatchDetailComponent {
    private matchService = inject(MatchService);
    protected authService = inject(AuthService);
    private message = inject(NzMessageService);
    private viewContainerRef = inject(ViewContainerRef);

    // Expose enum to template
    MatchStatus = MatchStatus;

    match = input<Match | null>(null);
    isModal = input<boolean>(true);
    close = output<void>();

    isAddGoalModalVisible = signal(false);
    isSetupModalVisible = signal(false);
    isEditMatchModalVisible = signal(false);
    isDeleting = signal(false);
    isAnnullando = signal(false);
    isIniziando = signal(false);
    isConcludendo = signal(false);

    goalTimeline = computed<GoalEvent[]>(() => this.match()?.goalTimeline || []);

    formattedDate = computed<string>(() => {
        const m = this.match();
        if (!m) return '';
        const d = new Date(m.date);
        return d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    });

    statusLabel = computed<string>(() => {
        const status = this.match()?.status;
        switch (status) {
            case MatchStatus.PROGRAMMATA: return 'PROGRAMMATA';
            case MatchStatus.IN_CORSO: return 'IN CORSO';
            case MatchStatus.CONCLUSA: return 'CONCLUSA';
            case MatchStatus.ANNULLATA: return 'ANNULLATA';
            default: return status || '';
        }
    });

    statusBadgeClass = computed<string>(() => {
        const status = this.match()?.status;
        switch (status) {
            case MatchStatus.PROGRAMMATA: return 'badge-programmata';
            case MatchStatus.IN_CORSO: return 'badge-in-corso';
            case MatchStatus.CONCLUSA: return 'badge-conclusa';
            case MatchStatus.ANNULLATA: return 'badge-annullata';
            default: return '';
        }
    });

    canDelete = computed<boolean>(() => {
        const m = this.match();
        return !!m && m.date.getTime() > Date.now() && this.authService.isAdminOrSuperAdmin();
    });

    canEdit = computed<boolean>(() => {
        const m = this.match();
        return !!m && m.status === MatchStatus.PROGRAMMATA && m.date.getTime() > Date.now() && this.authService.isAdminOrSuperAdmin();
    });

    canAnnulla = computed<boolean>(() => {
        const status = this.match()?.status;
        return (status === MatchStatus.IN_CORSO || status === MatchStatus.PROGRAMMATA) && this.authService.isAdminOrSuperAdmin();
    });

    canSetupLineup = computed<boolean>(() => {
        const m = this.match();
        return !!m && m.status === MatchStatus.PROGRAMMATA && this.authService.isAdminOrSuperAdmin();
    });

    canInizia = computed<boolean>(() => {
        const m = this.match();
        return !!m && m.status === MatchStatus.PROGRAMMATA && this.authService.isAdminOrSuperAdmin();
    });

    isMatchSetup = computed<boolean>(() => {
        const m = this.match();
        return !!m && (m.homePlayers?.length || 0) > 0 && (m.awayPlayers?.length || 0) > 0;
    });

    canConcludere = computed<boolean>(() => {
        const m = this.match();
        return !!m && m.status === MatchStatus.IN_CORSO && this.authService.isAdminOrSuperAdmin();
    });

    closeDetails() {
        this.close.emit();
    }

    openEditMatchModal(): void {
        this.isEditMatchModalVisible.set(true);
    }

    handleEditMatchSubmit(updatedMatch: MatchFormData): void {
        const currentMatch = this.match();
        if (!currentMatch) return;

        this.matchService.updateMatch(currentMatch.id, updatedMatch).subscribe({
            next: () => {
                this.message.success('Partita modificata con successo!');
                this.isEditMatchModalVisible.set(false);
            },
            error: error => {
                this.message.error(error?.error || 'Errore durante la modifica della partita.');
                this.isEditMatchModalVisible.set(false);
            }
        });
    }

    handleEditMatchCancel(): void {
        this.isEditMatchModalVisible.set(false);
    }

    chiediConfermaEliminazione() {
        const currentMatch = this.match();
        if (!currentMatch) {
            return;
        }

        const componentRef = this.viewContainerRef.createComponent(ConfirmModalComponent);
        componentRef.instance.isVisible = true;
        componentRef.instance.title = 'Elimina Partita';
        componentRef.instance.message = `Sei sicuro di voler eliminare definitivamente la partita ${currentMatch.homeTeam} - ${currentMatch.awayTeam}?`;
        componentRef.instance.confirmText = 'Elimina';
        componentRef.instance.isDanger = true;

        const confirmSub = componentRef.instance.confirm.subscribe(() => {
            this.eliminaPartita(currentMatch.id);
            confirmSub.unsubscribe();
            cancelSub.unsubscribe();
            componentRef.destroy();
        });

        const cancelSub = componentRef.instance.cancel.subscribe(() => {
            confirmSub.unsubscribe();
            cancelSub.unsubscribe();
            componentRef.destroy();
        });
    }

    private eliminaPartita(matchId: number) {
        this.isDeleting.set(true);
        this.matchService.deleteMatch(matchId).subscribe({
            next: () => {
                this.message.success('Partita eliminata con successo!');
                this.isDeleting.set(false);
                this.closeDetails();
            },
            error: () => {
                this.message.error('Errore durante l\'eliminazione della partita.');
                this.isDeleting.set(false);
            }
        });
    }

    chiediConfermaAnnullamento() {
        const currentMatch = this.match();
        if (!currentMatch) {
            return;
        }

        const componentRef = this.viewContainerRef.createComponent(ConfirmModalComponent);
        componentRef.instance.isVisible = true;
        componentRef.instance.title = 'Annulla Partita';
        componentRef.instance.message = `Sei sicuro di voler annullare la partita ${currentMatch.homeTeam} - ${currentMatch.awayTeam}? La partita verrà segnata come non disputata.`;
        componentRef.instance.confirmText = 'Annulla Partita';
        componentRef.instance.isDanger = true;

        const confirmSub = componentRef.instance.confirm.subscribe(() => {
            this.annullaPartita(currentMatch.id);
            confirmSub.unsubscribe();
            cancelSub.unsubscribe();
            componentRef.destroy();
        });

        const cancelSub = componentRef.instance.cancel.subscribe(() => {
            confirmSub.unsubscribe();
            cancelSub.unsubscribe();
            componentRef.destroy();
        });
    }

    private annullaPartita(matchId: number) {
        this.isAnnullando.set(true);
        this.matchService.annullaMatch(matchId).subscribe({
            next: () => {
                this.message.success('Partita annullata con successo!');
                this.isAnnullando.set(false);
            },
            error: () => {
                this.message.error('Errore durante l\'annullamento della partita.');
                this.isAnnullando.set(false);
            }
        });
    }

    iniziaPartita() {
        const currentMatch = this.match();
        if (!currentMatch) return;

        this.isIniziando.set(true);
        this.matchService.iniziaMatch(currentMatch.id).subscribe({
            next: () => {
                this.message.success('Partita iniziata con successo!');
                this.isIniziando.set(false);
            },
            error: () => {
                this.message.error('Errore durante l\'avvio della partita.');
                this.isIniziando.set(false);
            }
        });
    }

    chiediConfermaConclusione() {
        const currentMatch = this.match();
        if (!currentMatch) return;

        const componentRef = this.viewContainerRef.createComponent(ConfirmModalComponent);
        componentRef.instance.isVisible = true;
        componentRef.instance.title = 'Concludi Partita';
        componentRef.instance.message = 'Sei sicuro di voler concludere la partita? Una volta conclusa, non sarà più possibile registrare nuovi goal.';
        componentRef.instance.confirmText = 'Concludi';

        const confirmSub = componentRef.instance.confirm.subscribe(() => {
            this.concludiPartita(currentMatch.id);
            confirmSub.unsubscribe();
            cancelSub.unsubscribe();
            componentRef.destroy();
        });

        const cancelSub = componentRef.instance.cancel.subscribe(() => {
            confirmSub.unsubscribe();
            cancelSub.unsubscribe();
            componentRef.destroy();
        });
    }

    private concludiPartita(matchId: number) {
        this.isConcludendo.set(true);
        this.matchService.concludiMatch(matchId).subscribe({
            next: () => {
                this.message.success('Partita conclusa con successo!');
                this.isConcludendo.set(false);
            },
            error: () => {
                this.message.error('Errore durante la conclusione della partita.');
                this.isConcludendo.set(false);
            }
        });
    }

    openAddGoalModal() {
        this.isAddGoalModalVisible.set(true);
    }

    handleGoalSubmit(goal: GoalEvent) {
        const currentMatch = this.match();
        if (currentMatch) {
            this.matchService.addGoal(currentMatch.id, goal).subscribe({
                next: () => {
                    this.message.success('Goal registrato con successo!');
                    this.isAddGoalModalVisible.set(false);
                    // Ricarica dal backend: un marcatore/assist potrebbe essere stato aggiunto alla rosa per la prima volta
                    this.matchService.loadMatches().subscribe();
                },
                error: () => {
                    this.message.error('Errore durante la registrazione del goal.');
                    this.isAddGoalModalVisible.set(false);
                }
            });
        }
    }

    handleGoalCancel() {
        this.isAddGoalModalVisible.set(false);
    }

    openSetupModal() {
        this.isSetupModalVisible.set(true);
    }

    handleSetupSubmit(lineup: { homePlayerNames: string[]; awayPlayerNames: string[] }) {
        const currentMatch = this.match();
        if (currentMatch) {
            this.matchService.setupLineup(currentMatch.id, lineup.homePlayerNames, lineup.awayPlayerNames).subscribe({
                next: () => {
                    this.message.success('Formazioni impostate con successo!');
                    this.isSetupModalVisible.set(false);
                    this.matchService.loadMatches().subscribe();
                },
                error: () => {
                    this.message.error('Errore durante l\'impostazione delle formazioni.');
                    this.isSetupModalVisible.set(false);
                }
            });
        }
    }

    handleSetupCancel() {
        this.isSetupModalVisible.set(false);
    }
}
