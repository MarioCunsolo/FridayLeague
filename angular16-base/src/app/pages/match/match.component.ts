import { Component, inject, signal, OnInit } from '@angular/core';
import { MatchDetailComponent } from 'src/app/shared/component/match-detail/match-detail.component';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatchService } from 'src/app/shared/service/match.service';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-match',
  templateUrl: './match.component.html',
  styleUrls: ['./match.component.css'],
  standalone: true,
  imports: [MatchDetailComponent, DatePipe, NzButtonModule, NzIconModule]
})
export class MatchComponent implements OnInit {
  private matchService = inject(MatchService);
  private route = inject(ActivatedRoute);

  showMatchDetails = signal(false);
  selectedMatch = signal<any>(null);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const matchId = params['matchId'];
      if (matchId) {
        const match = this.matchService.getMatchById(+matchId);
        if (match) {
          this.openMatchDetails(match);
        }
      }
    });
  }

  openMatchDetails(match: any) {
    this.selectedMatch.set(match);
    this.showMatchDetails.set(true);
  }

  closeMatchDetails() {
    this.showMatchDetails.set(false);
    this.selectedMatch.set(null);
  }

  matches = this.matchService.getMatches();
}
