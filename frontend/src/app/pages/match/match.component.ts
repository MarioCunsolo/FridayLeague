import { Component, inject, signal, OnInit, computed, AfterViewInit } from '@angular/core';
import { MatchDetailComponent } from 'src/app/shared/component/match-detail/match-detail.component';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatchService } from 'src/app/shared/service/match.service';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSegmentedModule } from 'ng-zorro-antd/segmented';

@Component({
  selector: 'app-match',
  templateUrl: './match.component.html',
  styleUrls: ['./match.component.css'],
  standalone: true,
  imports: [MatchDetailComponent, DatePipe, NzButtonModule, NzIconModule]
})
export class MatchComponent implements OnInit, AfterViewInit {
  private matchService = inject(MatchService);
  private route = inject(ActivatedRoute);

  showMatchDetails = signal(false);
  selectedMatch = signal<any>(null);

  matches = this.matchService.getMatches();

  groupedMatches = computed(() => {
    const currentYear = 2026;
    const allMatches = this.matches().filter(m => new Date(m.date).getFullYear() === currentYear);
    const monthNames = [
      'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];

    const groups: { month: string, matches: any[] }[] = [];

    allMatches.forEach(match => {
      const date = new Date(match.date);
      const monthYear = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      
      let group = groups.find(g => g.month === monthYear);
      if (!group) {
        group = { month: monthYear, matches: [] };
        groups.push(group);
      }
      group.matches.push(match);
    });

    return groups;
  });

  nextMatchId = computed(() => {
    const programmable = this.matches()
      .filter(m => m.status === 'Programmata')
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    return programmable.length > 0 ? programmable[0].id : null;
  });

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

  ngAfterViewInit() {
    setTimeout(() => {
      const nextMatchElement = document.querySelector('.next-match');
      if (nextMatchElement) {
        nextMatchElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 200);
  }
}
