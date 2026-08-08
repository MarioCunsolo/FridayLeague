import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzSegmentedModule } from 'ng-zorro-antd/segmented';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { PlayerStats } from '../../models/interface/player-stats.interface';
import { StatsService } from '../../shared/service/stats.service';

import { trigger, transition, style, animate, keyframes } from '@angular/animations';

import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, FormsModule, NzSegmentedModule, NzIconModule, NzAvatarModule],
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss'],
  animations: [
    trigger('tabAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition('* => *', [
        animate('300ms ease-in-out', keyframes([
          style({ opacity: 0.5, transform: 'scale(0.98)', offset: 0.5 }),
          style({ opacity: 1, transform: 'scale(1)', offset: 1 })
        ]))
      ])
    ])
  ]
})
export class StatsComponent implements OnInit {
  private statsService = inject(StatsService);
  private route = inject(ActivatedRoute);

  options = ['GOL', 'ASSIST', 'MOTM'];
  activeOption = signal('GOL');

  scorers = signal<PlayerStats[]>([]);
  assists = signal<PlayerStats[]>([]);
  motm = signal<PlayerStats[]>([]);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        const tabUpper = params['tab'].toUpperCase();
        if (this.options.includes(tabUpper)) {
          this.activeOption.set(tabUpper);
        }
      }
    });

    this.statsService.getScorers().subscribe(data => this.scorers.set(data));
    this.statsService.getAssists().subscribe(data => this.assists.set(data));
    this.statsService.getMOTM().subscribe(data => this.motm.set(data));
  }

  handleIndexChange(value: string | number): void {
    const selected = typeof value === 'number' ? this.options[value] : value;
    this.activeOption.set(selected);
  }

  get activeList() {
    switch (this.activeOption()) {
      case 'GOL': return this.scorers();
      case 'ASSIST': return this.assists();
      case 'MOTM': return this.motm();
      default: return this.scorers();
    }
  }

  get top3() {
    return this.activeList.slice(0, 3);
  }

  get others() {
    return this.activeList.slice(3);
  }
}
