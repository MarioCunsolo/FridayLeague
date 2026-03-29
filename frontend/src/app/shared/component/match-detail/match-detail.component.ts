import { Component, input, output, computed, signal, inject } from '@angular/core';
import { GoalEvent, Match } from '../../../models/interface/match.interface';

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

    match = input<Match | null>(null);
    isModal = input<boolean>(true);
    close = output<void>();

    isAddGoalModalVisible = signal(false);

    goalTimeline = computed<GoalEvent[]>(() => {
        const matchData = this.match();
        if (!matchData) return [];

        if (matchData.goalTimeline) {
            return matchData.goalTimeline;
        }

        // Generate dummy timeline if no real timeline exists
        const homeGoals = matchData.homeScore || 0;
        const awayGoals = matchData.awayScore || 0;
        const totalGoals = homeGoals + awayGoals;
        const timeline: GoalEvent[] = [];

        let homeCount = 0;
        let awayCount = 0;

        for (let i = 0; i < totalGoals; i++) {
            const hasAssist = Math.random() > 0.4;
            const assistName = hasAssist ? 'Mario Cunsolo' : undefined;

            if (homeCount < homeGoals && (i % 2 === 0 || awayCount >= awayGoals)) {
                homeCount++;
                timeline.push({
                    scorerName: `Giocatore Casa ${homeCount}`,
                    isHome: true,
                    assistName: assistName
                });
            } else if (awayCount < awayGoals) {
                awayCount++;
                timeline.push({
                    scorerName: `Avversario ${awayCount}`,
                    isHome: false,
                    assistName: assistName
                });
            }
        }
        return timeline;
    });

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
