import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { AuthService } from '../../../../shared/service/auth.service';
import { injectAppOverlayData, injectAppOverlayRef } from '../../../../shared/overlay/app-overlay-injectors';

export type PasswordFormDialogData = Record<string, never>;

@Component({
  selector: 'app-password-form',
  standalone: true,
  imports: [FormsModule, NzButtonModule],
  templateUrl: './password-form.component.html',
  styleUrl: './password-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PasswordFormComponent {
  readonly data = injectAppOverlayData<PasswordFormDialogData>();
  private readonly overlayRef = injectAppOverlayRef<true>();
  private readonly authService = inject(AuthService);

  nuovaPassword = '';
  confermaPassword = '';
  readonly saving = signal(false);
  readonly errorMessage = signal('');

  save(): void {
    this.errorMessage.set('');

    if (!this.nuovaPassword || this.nuovaPassword.length < 6) {
      this.errorMessage.set('La password deve contenere almeno 6 caratteri.');
      return;
    }

    if (this.nuovaPassword !== this.confermaPassword) {
      this.errorMessage.set('Le password inserite non coincidono.');
      return;
    }

    this.saving.set(true);
    this.authService.cambiaPassword(this.nuovaPassword).subscribe({
      next: () => this.overlayRef.close(true),
      error: error => {
        this.saving.set(false);
        this.errorMessage.set(error.error || 'Errore durante il salvataggio.');
      }
    });
  }

  cancel(): void {
    if (!this.saving()) this.overlayRef.dismiss();
  }
}
