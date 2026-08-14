import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { MatchFormData } from '../../../../models/api/match.models';
import { Match } from '../../../../models/interface/match.interface';
import { injectAppOverlayData, injectAppOverlayRef } from '../../../../shared/overlay/app-overlay-injectors';

export interface MatchFormDialogData {
  matchToEdit: Match | null;
}

function squadreDiverseValidator(control: AbstractControl): ValidationErrors | null {
  const homeTeam = control.parent?.get('homeTeam')?.value?.trim().toLowerCase();
  const awayTeam = control.value?.trim().toLowerCase();
  return homeTeam && awayTeam && homeTeam === awayTeam ? { squadreUguali: true } : null;
}

@Component({
  selector: 'app-match-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NzButtonModule,
    NzDatePickerModule,
    NzFormModule,
    NzInputModule
  ],
  templateUrl: './match-form.component.html',
  styleUrl: './match-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MatchFormComponent {
  readonly data = injectAppOverlayData<MatchFormDialogData>();
  private readonly overlayRef = injectAppOverlayRef<MatchFormData>();
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly matchForm = this.fb.group({
    homeTeam: ['', Validators.required],
    awayTeam: ['', [Validators.required, squadreDiverseValidator]],
    date: [null as Date | null, Validators.required]
  });

  readonly isEditMode = this.data.matchToEdit !== null;

  constructor() {
    this.matchForm.controls.homeTeam.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.matchForm.controls.awayTeam.updateValueAndValidity({ onlySelf: true }));

    const match = this.data.matchToEdit;
    this.matchForm.reset({
      homeTeam: match?.homeTeam ?? '',
      awayTeam: match?.awayTeam ?? '',
      date: match ? new Date(match.date) : null
    });
  }

  save(): void {
    if (this.matchForm.invalid) {
      Object.values(this.matchForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    const value = this.matchForm.getRawValue();
    if (!value.date) return;

    this.overlayRef.close({
      homeTeam: value.homeTeam.trim(),
      awayTeam: value.awayTeam.trim(),
      date: value.date
    });
  }

  cancel(): void {
    this.overlayRef.dismiss();
  }
}
