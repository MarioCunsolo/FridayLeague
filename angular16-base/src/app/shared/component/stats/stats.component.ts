import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzSegmentedModule } from 'ng-zorro-antd/segmented';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';

import { trigger, transition, style, animate, keyframes } from '@angular/animations';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, NzSegmentedModule, NzIconModule, NzAvatarModule],
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css'],
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
export class StatsComponent {
  options = ['GOL', 'ASSIST'];
  activeOption = signal('GOL');

  scorers = signal([
    { name: 'Mario Cunsolo', team: 'Squali Rossi', value: 12, avatar: 'MC', color: '#00cc66' },
    { name: 'Luigi Verdi', team: 'Leoni FC', value: 9, avatar: 'LV', color: '#3399ff' },
    { name: 'Francesco Rossi', team: 'Aquile Nere', value: 8, avatar: 'FR', color: '#ffcc00' },
    { name: 'Andrea Blu', team: 'Squali Rossi', value: 6, avatar: 'AB', color: '#ff4444' },
    { name: 'Simone Neri', team: 'Lupi Selvaggi', value: 5, avatar: 'SN', color: '#9933ff' },
    { name: 'Carlo Gialli', team: 'Tigri Bianche', value: 4, avatar: 'CG', color: '#ff9933' },
    { name: 'Giuseppe Bianchi', team: 'Pirati del Campo', value: 3, avatar: 'GB', color: '#33cccc' },
  ]);

  assists = signal([
    { name: 'Andrea Blu', team: 'Squali Rossi', value: 8, avatar: 'AB', color: '#ff4444' },
    { name: 'Mario Cunsolo', team: 'Squali Rossi', value: 7, avatar: 'MC', color: '#00cc66' },
    { name: 'Carlo Gialli', team: 'Tigri Bianche', value: 6, avatar: 'CG', color: '#ff9933' },
    { name: 'Luigi Verdi', team: 'Leoni FC', value: 5, avatar: 'LV', color: '#3399ff' },
    { name: 'Francesco Rossi', team: 'Aquile Nere', value: 4, avatar: 'FR', color: '#ffcc00' },
    { name: 'Simone Neri', team: 'Lupi Selvaggi', value: 3, avatar: 'SN', color: '#9933ff' },
    { name: 'Giuseppe Bianchi', team: 'Pirati del Campo', value: 2, avatar: 'GB', color: '#33cccc' },
  ]);

  handleIndexChange(value: string | number): void {
    const selected = typeof value === 'number' ? this.options[value] : value;
    this.activeOption.set(selected);
  }

  get activeList() {
    return this.activeOption() === 'GOL' ? this.scorers() : this.assists();
  }

  get top3() {
    return this.activeList.slice(0, 3);
  }

  get others() {
    return this.activeList.slice(3);
  }
}
