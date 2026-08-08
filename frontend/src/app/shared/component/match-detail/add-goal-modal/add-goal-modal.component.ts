import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { Match, Player, GoalEvent } from '../../../../models/interface/match.interface';

@Component({
  selector: 'app-add-goal-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzSelectModule,
    NzButtonModule,
    NzRadioModule,
    NzIconModule
  ],
  templateUrl: './add-goal-modal.component.html',
  styleUrls: ['./add-goal-modal.component.scss']
})
export class AddGoalModalComponent {
  match = input<Match | null>(null);
  submit = output<GoalEvent>();
  cancel = output<void>();

  goalForm: FormGroup;
  isConfirmLoading = false;
  currentPlayers = signal<Player[]>([]);

  constructor(private fb: FormBuilder) {
    this.goalForm = this.fb.group({
      isHome: [true, [Validators.required]],
      scorerName: [null, [Validators.required]],
      assistName: [null]
    });
  }

  ngOnInit() {
    this.onTeamChange();
  }

  onTeamChange() {
    const isHome = this.goalForm.get('isHome')?.value;
    const matchData = this.match();
    if (matchData) {
      this.currentPlayers.set(isHome ? (matchData.homePlayers || []) : (matchData.awayPlayers || []));
      this.goalForm.patchValue({ scorerName: null, assistName: null });
    }
  }

  handleOk(): void {
    if (this.goalForm.valid) {
      this.isConfirmLoading = true;
      this.submit.emit(this.goalForm.value);
    } else {
      Object.values(this.goalForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  handleCancel(): void {
    this.cancel.emit();
  }
}
