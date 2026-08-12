import { Component, DestroyRef, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { MatchStatus } from '../../../models/interface/match.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface NewMatchData {
  homeTeam: string;
  awayTeam: string;
  date: Date;
  status: MatchStatus;
  homeScore: number;
  awayScore: number;
}

function squadreDiverseValidator(control: AbstractControl): ValidationErrors | null {
  const homeTeam = control.parent?.get('homeTeam')?.value?.trim().toLowerCase();
  const awayTeam = control.value?.trim().toLowerCase();
  if (homeTeam && awayTeam && homeTeam === awayTeam) {
    return { squadreUguali: true };
  }
  return null;
}

@Component({
  selector: 'app-add-match-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzDatePickerModule,
    NzButtonModule,
    NzIconModule
  ],
  templateUrl: './add-match-modal.component.html',
  styleUrls: ['./add-match-modal.component.scss']
})
export class AddMatchModalComponent {
  submit = output<NewMatchData>();
  cancel = output<void>();

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  readonly matchForm = this.fb.group({
    homeTeam: ['', [Validators.required]],
    awayTeam: ['', [Validators.required, squadreDiverseValidator]],
    date: [null as Date | null, [Validators.required]]
  });
  isConfirmLoading = false;

  constructor() {
    // Il validatore su awayTeam confronta col valore di homeTeam: va ricalcolato quando homeTeam cambia
    this.matchForm.controls.homeTeam.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() =>
      this.matchForm.controls.awayTeam.updateValueAndValidity({ onlySelf: true }));
  }

  handleOk(): void {
    if (this.matchForm.valid) {
      this.isConfirmLoading = true;
      const value = this.matchForm.getRawValue();
      if (!value.date) return;
      this.submit.emit({
        homeTeam: value.homeTeam.trim(),
        awayTeam: value.awayTeam.trim(),
        date: value.date,
        status: MatchStatus.PROGRAMMATA,
        homeScore: 0,
        awayScore: 0
      });
    } else {
      Object.values(this.matchForm.controls).forEach(control => {
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
