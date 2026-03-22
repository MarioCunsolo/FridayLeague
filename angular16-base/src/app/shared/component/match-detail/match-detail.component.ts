import { Component, input, output, computed } from '@angular/core';
import { GoalEvent } from '../../../models/interface/match.interface';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
    selector: 'app-match-detail',
    templateUrl: './match-detail.component.html',
    styleUrls: ['./match-detail.component.css'],
    standalone: true,
    imports: [NzButtonModule, NzIconModule]
})
export class MatchDetailComponent {
    match = input<any>();
    isModal = input<boolean>(true);
    close = output<void>();

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
}
