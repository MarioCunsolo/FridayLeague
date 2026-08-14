import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { GoalEvent, Match, Player } from '../../../../models/interface/match.interface';
import { injectAppOverlayData, injectAppOverlayRef } from '../../../../shared/overlay/app-overlay-injectors';

export interface GoalFormDialogData {
  match: Match;
}

@Component({
  selector: 'app-goal-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NzButtonModule,
    NzFormModule,
    NzRadioModule,
    NzSelectModule
  ],
  templateUrl: './goal-form.component.html',
  styleUrl: './goal-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GoalFormComponent {
  readonly data = injectAppOverlayData<GoalFormDialogData>();
  private readonly overlayRef = injectAppOverlayRef<GoalEvent>();
  private readonly fb = inject(NonNullableFormBuilder);

  readonly goalForm = this.fb.group({
    isHome: [true, Validators.required],
    scorerName: [null as string | null, Validators.required],
    assistName: [null as string | null]
  });

  readonly currentPlayers = signal<Player[]>(this.data.match.homePlayers ?? []);

  onTeamChange(): void {
    const isHome = this.goalForm.controls.isHome.value;
    this.currentPlayers.set(isHome ? this.data.match.homePlayers ?? [] : this.data.match.awayPlayers ?? []);
    this.goalForm.patchValue({ scorerName: null, assistName: null });
  }

  save(): void {
    if (this.goalForm.invalid) {
      this.goalForm.markAllAsTouched();
      return;
    }

    const value = this.goalForm.getRawValue();
    if (!value.scorerName) return;

    this.overlayRef.close({
      isHome: value.isHome,
      scorerName: value.scorerName,
      assistName: value.assistName ?? undefined
    });
  }

  cancel(): void {
    this.overlayRef.dismiss();
  }
}
