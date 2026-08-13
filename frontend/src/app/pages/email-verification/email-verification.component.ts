import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { AuthService } from '../../shared/service/auth.service';

type VerificationState = 'loading' | 'success' | 'invalid' | 'missing' | 'error';

@Component({
  selector: 'app-email-verification',
  standalone: true,
  imports: [CommonModule, RouterLink, NzButtonModule, NzIconModule],
  templateUrl: './email-verification.component.html',
  styleUrls: ['./email-verification.component.scss']
})
export class EmailVerificationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly authService = inject(AuthService);

  readonly state = signal<VerificationState>('loading');
  readonly message = signal('Verifica del tuo indirizzo email in corso...');

  ngOnInit(): void {
    const fragment = this.route.snapshot.fragment ?? '';
    const token = new URLSearchParams(fragment).get('token');
    this.location.replaceState(this.router.url.split('#')[0]);

    if (!token) {
      this.state.set('missing');
      this.message.set('Il link di attivazione è incompleto. Richiedi una nuova email di verifica.');
      return;
    }

    this.authService.verifyEmail({ token }).subscribe({
      next: response => {
        this.state.set('success');
        this.message.set(response.message);
      },
      error: error => {
        if (error.error?.code === 'INVALID_OR_EXPIRED_TOKEN') {
          this.state.set('invalid');
          this.message.set(error.error.message);
          return;
        }

        this.state.set('error');
        this.message.set('Non è stato possibile completare la verifica. Riprova tra poco.');
      }
    });
  }
}
