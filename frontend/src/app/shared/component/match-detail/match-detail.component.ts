import { Component, input, output, computed, signal, inject, ViewContainerRef } from '@angular/core';
import { GoalEvent, Match, MatchStatus } from '../../../models/interface/match.interface';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { AddGoalModalComponent } from './add-goal-modal/add-goal-modal.component';
import { SetupMatchModalComponent } from './setup-match-modal/setup-match-modal.component';
import { MatchService } from '../../service/match.service';
import { AuthService } from '../../service/auth.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';

@Component({
    selector: 'app-match-detail',
    templateUrl: './match-detail.component.html',
    styleUrls: ['./match-detail.component.scss'],
    standalone: true,
    imports: [NzButtonModule, NzIconModule, AddGoalModalComponent, SetupMatchModalComponent]
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
    isDeleting = signal(false);
    isAnnullando = signal(false);

    goalTimeline = computed<GoalEvent[]>(() => this.match()?.goalTimeline || []);

    canDelete = computed<boolean>(() => {
        const m = this.match();
        return !!m && m.date.getTime() > Date.now() && this.authService.isAdminOrSuperAdmin();
    });

    canAnnulla = computed<boolean>(() => {
        const status = this.match()?.status;
        return (status === MatchStatus.IN_CORSO || status === MatchStatus.PROGRAMMATA) && this.authService.isAdminOrSuperAdmin();
    });

    canSetupLineup = computed<boolean>(() => {
        const m = this.match();
        return !!m && m.status === MatchStatus.PROGRAMMATA && this.authService.isAdminOrSuperAdmin();
    });

    closeDetails() {
        this.close.emit();
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
