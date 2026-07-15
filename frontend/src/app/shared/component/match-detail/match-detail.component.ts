import { Component, input, output, computed, signal, inject } from '@angular/core';
import { GoalEvent, Match, MatchStatus } from '../../../models/interface/match.interface';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { AddGoalModalComponent } from './add-goal-modal/add-goal-modal.component';
import { MatchService } from '../../service/match.service';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
    selector: 'app-match-detail',
    templateUrl: './match-detail.component.html',
    styleUrls: ['./match-detail.component.css'],
    standalone: true,
    imports: [NzButtonModule, NzIconModule, AddGoalModalComponent]
})
export class MatchDetailComponent {
    private matchService = inject(MatchService);
    private message = inject(NzMessageService);

    // Expose enum to template
    MatchStatus = MatchStatus;

    match = input<Match | null>(null);
    isModal = input<boolean>(true);
    close = output<void>();

    isAddGoalModalVisible = signal(false);

    goalTimeline = computed<GoalEvent[]>(() => this.match()?.goalTimeline || []);

    closeDetails() {
        this.close.emit();
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
}
