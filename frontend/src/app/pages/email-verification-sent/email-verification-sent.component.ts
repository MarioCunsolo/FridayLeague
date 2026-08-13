import { Component, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { AuthService } from '../../shared/service/auth.service';

@Component({
  selector: 'app-email-verification-sent',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NzButtonModule, NzFormModule, NzIconModule, NzInputModule],
  templateUrl: './email-verification-sent.component.html',
  styleUrls: ['./email-verification-sent.component.scss']
})
export class EmailVerificationSentComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private cooldownTimer: ReturnType<typeof setInterval> | null = null;

  readonly resendForm: FormGroup<{ email: FormControl<string> }> = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });
  readonly resending = signal(false);
  readonly message = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly remainingSeconds = signal(0);

  resend(): void {
    if (this.resendForm.invalid || this.resending() || this.remainingSeconds() > 0) {
      this.resendForm.controls.email.markAsDirty();
      this.resendForm.controls.email.updateValueAndValidity({ onlySelf: true });
      return;
    }

    this.resending.set(true);
    this.message.set(null);
    this.errorMessage.set(null);
    this.authService.resendVerification(this.resendForm.getRawValue()).subscribe({
      next: response => {
        this.message.set(response.message);
        this.resending.set(false);
        this.startCooldown();
      },
      error: () => {
        this.errorMessage.set('Non è stato possibile richiedere una nuova email. Riprova tra poco.');
        this.resending.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
  }

  private startCooldown(): void {
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
    this.remainingSeconds.set(60);
    this.cooldownTimer = setInterval(() => {
      const remaining = this.remainingSeconds() - 1;
      this.remainingSeconds.set(Math.max(remaining, 0));
      if (remaining <= 0 && this.cooldownTimer) {
        clearInterval(this.cooldownTimer);
        this.cooldownTimer = null;
      }
    }, 1000);
  }
}
