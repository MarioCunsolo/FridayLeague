import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

export interface GoalEvent {
    scorerName: string;
    isHome: boolean;
    assistName?: string;
}

@Component({
    selector: 'app-match-detail',
    templateUrl: './match-detail.component.html',
    styleUrls: ['./match-detail.component.css']
})
export class MatchDetailComponent implements OnInit {
    @Input() match: any;
    @Output() close = new EventEmitter<void>();

    goalTimeline: GoalEvent[] = [];

    ngOnInit() {
        if (this.match) {
            // Generate dummy timeline if no real timeline exists
            if (!this.match.goalTimeline) {
                this.generateDummyTimeline();
            } else {
                this.goalTimeline = this.match.goalTimeline;
            }
        }
    }

    private generateDummyTimeline() {
        const homeGoals = this.match.homeScore || 0;
        const awayGoals = this.match.awayScore || 0;
        const totalGoals = homeGoals + awayGoals;

        let homeCount = 0;
        let awayCount = 0;

        for (let i = 0; i < totalGoals; i++) {
            const hasAssist = Math.random() > 0.4; // 60% dei gol ha un assist
            const assistName = hasAssist ? 'Mario Cunsolo' : undefined;

            // Un po' di logica per alternare (in modo fittizio)
            if (homeCount < homeGoals && (i % 2 === 0 || awayCount >= awayGoals)) {
                homeCount++;
                this.goalTimeline.push({
                    scorerName: `Giocatore Casa ${homeCount}`,
                    isHome: true,
                    assistName: assistName
                });
            } else if (awayCount < awayGoals) {
                awayCount++;
                this.goalTimeline.push({
                    scorerName: `Avversario ${awayCount}`,
                    isHome: false,
                    assistName: assistName
                });
            }
        }
    }

    closeDetails() {
        this.close.emit();
    }
}
