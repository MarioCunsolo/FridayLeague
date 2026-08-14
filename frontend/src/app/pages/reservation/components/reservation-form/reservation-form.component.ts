import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { injectAppOverlayData, injectAppOverlayRef } from '../../../../shared/overlay/app-overlay-injectors';

export interface ReservationFormPerson {
  id: string;
  nomeCognome: string;
}

export interface ReservationFormDialogData {
  availablePeople: readonly ReservationFormPerson[];
}

export interface ReservationFormResult {
  nomeCognome: string;
}

@Component({
  selector: 'app-reservation-form',
  standalone: true,
  imports: [
    A11yModule,
    ReactiveFormsModule,
    NzAutocompleteModule,
    NzButtonModule,
    NzFormModule,
    NzInputModule
  ],
  templateUrl: './reservation-form.component.html',
  styleUrl: './reservation-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReservationFormComponent {
  readonly data = injectAppOverlayData<ReservationFormDialogData>();
  private readonly overlayRef = injectAppOverlayRef<ReservationFormResult>();
  private readonly fb = inject(NonNullableFormBuilder);

  readonly form = this.fb.group({
    nomeCognome: ['', Validators.required]
  });

  private readonly query = toSignal(this.form.controls.nomeCognome.valueChanges, {
    initialValue: ''
  });

  readonly filteredPeople = computed(() => {
    const query = this.normalize(this.query());
    return this.data.availablePeople.filter(person =>
      this.normalize(person.nomeCognome).includes(query)
    );
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.overlayRef.close({
      nomeCognome: this.form.controls.nomeCognome.getRawValue().trim()
    });
  }

  cancel(): void {
    this.overlayRef.dismiss();
  }

  private normalize(value: string): string {
    return value.trim().toLocaleLowerCase('it-IT');
  }
}
