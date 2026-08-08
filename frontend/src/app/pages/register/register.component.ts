import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/service/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    RouterLink
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  registerForm: FormGroup<{
    nome: FormControl<string>;
    cognome: FormControl<string>;
    email: FormControl<string>;
    password: FormControl<string>;
  }>;

  errorMessage = signal<string | null>(null);

  constructor() {
    this.registerForm = this.fb.nonNullable.group({
      nome: ['', [Validators.required]],
      cognome: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  submitForm(): void {
    if (this.registerForm.valid) {
      this.errorMessage.set(null);
      this.authService.register(this.registerForm.value).subscribe({
        next: () => {
          // Reindirizza al login passando il parametro di successo
          this.router.navigate(['/login'], { queryParams: { registered: 'true' } });
        },
        error: (err) => {
          console.error('Registration failed', err);
          if (err.error && typeof err.error === 'string') {
            this.errorMessage.set(err.error);
          } else if (err.error && err.error.message) {
            this.errorMessage.set(err.error.message);
          } else {
            this.errorMessage.set('Errore durante la registrazione. Riprova.');
          }
        }
      });
    } else {
      Object.values(this.registerForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }
}
