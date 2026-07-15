import { Component, inject, signal, OnInit, computed, AfterViewInit } from '@angular/core';
import { MatchDetailComponent } from 'src/app/shared/component/match-detail/match-detail.component';
import { Match, MatchStatus } from 'src/app/models/interface/match.interface';
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
  
  // Expose Enum to Template
  MatchStatus = MatchStatus;

  showMatchDetails = signal(false);
  selectedMatchId = signal<number | null>(null);

  matches = this.matchService.getMatches();

  // Derivato da matches(): si aggiorna automaticamente dopo un goal, senza restare legato allo snapshot aperto nel modale
  selectedMatch = computed(() => {
    const id = this.selectedMatchId();
    return id !== null ? this.matches().find(m => m.id === id) ?? null : null;
  });

  groupedMatches = computed(() => {
    const currentYear = 2026;
    const allMatches = this.matches().filter(m => new Date(m.date).getFullYear() === currentYear);
    const monthNames = [
      'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];
    
    interface MatchGroup {
      month: string;
      matches: Match[];
    }

    const groups: MatchGroup[] = [];

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
      .filter(m => m.status === MatchStatus.PROGRAMMATA)
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

  openMatchDetails(match: Match) {
    this.selectedMatchId.set(match.id);
    this.showMatchDetails.set(true);
  }

  closeMatchDetails() {
    this.showMatchDetails.set(false);
    this.selectedMatchId.set(null);
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
