import { Component, DestroyRef, effect, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { Match } from '../../../models/interface/match.interface';
import { MatchFormData } from '../../../models/api/match.models';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
  /** Se presente la modale opera in modifica e precompila gli stessi campi della creazione. */
  readonly matchToEdit = input<Match | null>(null);
  readonly submit = output<MatchFormData>();
  readonly cancel = output<void>();

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  readonly matchForm = this.fb.group({
    homeTeam: ['', [Validators.required]],
    awayTeam: ['', [Validators.required, squadreDiverseValidator]],
    date: [null as Date | null, [Validators.required]]
  });
  isConfirmLoading = false;

  get isEditMode(): boolean {
    return this.matchToEdit() !== null;
  }

  constructor() {
    // Il validatore su awayTeam confronta col valore di homeTeam: va ricalcolato quando homeTeam cambia
    this.matchForm.controls.homeTeam.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() =>
      this.matchForm.controls.awayTeam.updateValueAndValidity({ onlySelf: true }));

    effect(() => {
      const match = this.matchToEdit();
      this.isConfirmLoading = false;
      this.matchForm.reset({
        homeTeam: match?.homeTeam ?? '',
        awayTeam: match?.awayTeam ?? '',
        date: match ? new Date(match.date) : null
      });
    });
  }

  handleOk(): void {
    if (this.matchForm.valid) {
      this.isConfirmLoading = true;
      const value = this.matchForm.getRawValue();
      if (!value.date) return;
      this.submit.emit({
        homeTeam: value.homeTeam.trim(),
        awayTeam: value.awayTeam.trim(),
        date: value.date
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
