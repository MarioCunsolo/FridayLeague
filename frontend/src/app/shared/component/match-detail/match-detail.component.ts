import { Component, DestroyRef, input, output, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoalEvent, Match, MatchStatus } from '../../../models/interface/match.interface';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { MatchFormData } from '../../../models/api/match.models';
import { MatchService } from '../../service/match.service';
import { AuthService } from '../../service/auth.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ResponsiveOverlayService } from '../../overlay/responsive-overlay.service';
import {
    ConfirmActionComponent,
    ConfirmActionData
} from '../../overlay/content/confirm-action/confirm-action.component';
import {
    MatchFormComponent,
    MatchFormDialogData
} from '../../../pages/match/components/match-form/match-form.component';
import {
    GoalFormComponent,
    GoalFormDialogData
} from '../../../pages/match/components/goal-form/goal-form.component';
import {
    LineupFormComponent,
    LineupFormDialogData,
    LineupFormResult
} from '../../../pages/match/components/lineup-form/lineup-form.component';

@Component({
    selector: 'app-match-detail',
    templateUrl: './match-detail.component.html',
    styleUrls: ['./match-detail.component.scss'],
    standalone: true,
    imports: [CommonModule, NzButtonModule, NzIconModule]
})
export class MatchDetailComponent {
    private matchService = inject(MatchService);
    protected authService = inject(AuthService);
    private message = inject(NzMessageService);
    private overlays = inject(ResponsiveOverlayService);
    private destroyRef = inject(DestroyRef);

    // Expose enum to template
    MatchStatus = MatchStatus;

    match = input<Match | null>(null);
    isModal = input<boolean>(true);
    detailsClosed = output<void>();

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
        this.detailsClosed.emit();
    }

    openEditMatchModal(): void {
        const currentMatch = this.match();
        if (!currentMatch) return;

        this.overlays.open<MatchFormDialogData, MatchFormData>(MatchFormComponent, {
            title: 'Modifica partita',
            data: { matchToEdit: currentMatch },
            modal: { width: 512 },
            drawer: { height: 'auto' }
        }).afterClosed$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(result => {
                if (!result) return;

                this.matchService.updateMatch(currentMatch.id, result).subscribe({
                    next: () => this.message.success('Partita modificata con successo!'),
                    error: error => this.message.error(error?.error || 'Errore durante la modifica della partita.')
                });
            });
    }

    chiediConfermaEliminazione() {
        const currentMatch = this.match();
        if (!currentMatch) {
            return;
        }

        this.openConfirmation({
            title: 'Elimina partita',
            message: `Sei sicuro di voler eliminare definitivamente la partita ${currentMatch.homeTeam} - ${currentMatch.awayTeam}?`,
            confirmText: 'Elimina',
            danger: true,
            onConfirm: () => this.eliminaPartita(currentMatch.id)
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

        this.openConfirmation({
            title: 'Annulla partita',
            message: `Sei sicuro di voler annullare la partita ${currentMatch.homeTeam} - ${currentMatch.awayTeam}? La partita verrà segnata come non disputata.`,
            confirmText: 'Annulla partita',
            danger: true,
            onConfirm: () => this.annullaPartita(currentMatch.id)
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

        this.openConfirmation({
            title: 'Concludi partita',
            message: 'Sei sicuro di voler concludere la partita? Una volta conclusa, non sarà più possibile registrare nuovi goal.',
            confirmText: 'Concludi',
            danger: false,
            onConfirm: () => this.concludiPartita(currentMatch.id)
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
        const currentMatch = this.match();
        if (!currentMatch) return;

        this.overlays.open<GoalFormDialogData, GoalEvent>(GoalFormComponent, {
            title: 'Registra goal',
            data: { match: currentMatch },
            modal: { width: 512 },
            drawer: { height: 'auto' }
        }).afterClosed$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(goal => {
                if (!goal) return;

                this.matchService.addGoal(currentMatch.id, goal).subscribe({
                    next: () => {
                        this.message.success('Goal registrato con successo!');
                        this.matchService.loadMatches().subscribe();
                    },
                    error: () => this.message.error('Errore durante la registrazione del goal.')
                });
            });
    }

    openSetupModal() {
        const currentMatch = this.match();
        if (!currentMatch) return;

        this.overlays.open<LineupFormDialogData, LineupFormResult>(LineupFormComponent, {
            title: 'Imposta partita',
            data: { match: currentMatch },
            modal: { width: '52rem' },
            drawer: { height: '90dvh' }
        }).afterClosed$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(lineup => {
                if (!lineup) return;

                this.matchService.setupLineup(currentMatch.id, lineup.homePlayerNames, lineup.awayPlayerNames).subscribe({
                    next: () => {
                        this.message.success('Formazioni impostate con successo!');
                        this.matchService.loadMatches().subscribe();
                    },
                    error: () => this.message.error('Errore durante l\'impostazione delle formazioni.')
                });
            });
    }

    private openConfirmation(options: {
        title: string;
        message: string;
        confirmText: string;
        danger: boolean;
        onConfirm: () => void;
    }): void {
        this.overlays.open<ConfirmActionData, true>(ConfirmActionComponent, {
            title: options.title,
            data: {
                message: options.message,
                confirmText: options.confirmText,
                danger: options.danger
            },
            modal: { width: 416 },
            drawer: { height: 'auto' }
        }).afterClosed$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(confirmed => {
                if (confirmed) options.onConfirm();
            });
    }
}
