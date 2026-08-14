import { Component, DestroyRef, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService } from 'src/app/shared/service/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ResponsiveOverlayService } from 'src/app/shared/overlay/responsive-overlay.service';
import {
  PasswordFormComponent,
  PasswordFormDialogData
} from './components/password-form/password-form.component';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NzIconModule,
    NzButtonModule
  ]
})
export class AccountComponent {
  public authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private message = inject(NzMessageService);
  private overlays = inject(ResponsiveOverlayService);
  private destroyRef = inject(DestroyRef);

  salvando = signal(false);
  profileForm: FormGroup;

  // Calcolo delle iniziali dell'avatar
  userInitials = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return '??';
    const n = user.nome?.[0] || '';
    const c = user.cognome?.[0] || '';
    return (n + c).toUpperCase() || '?';
  });

  constructor() {
    // Inizializzazione form di modifica profilo
    this.profileForm = this.fb.group({
      nome: ['', [Validators.required]],
      cognome: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]]
    });

    // Sincronizzazione automatica tramite effect all'aggiornamento dell'utente
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.profileForm.patchValue({
          nome: user.nome,
          cognome: user.cognome,
          email: user.email
        });
      }
    });
  }

  salvaProfilo() {
    if (this.profileForm.invalid) {
      this.message.error('Per favore, compila correttamente tutti i campi richiesti.');
      return;
    }

    this.salvando.set(true);
    const formValues = this.profileForm.value;

    const payload = {
      nome: formValues.nome.trim(),
      cognome: formValues.cognome.trim(),
      email: formValues.email.trim()
    };

    this.authService.aggiornaProfilo(payload).subscribe({
      next: () => {
        this.message.success('Informazioni account aggiornate con successo!');
        this.salvando.set(false);
      },
      error: (err) => {
        console.error(err);
        this.message.error(err.error || "Errore durante l'aggiornamento del profilo.");
        this.salvando.set(false);
      }
    });
  }

  apriModificaPassword(): void {
    this.overlays.open<PasswordFormDialogData, true>(PasswordFormComponent, {
      title: 'Modifica password',
      data: {},
      maskClosable: false,
      modal: { width: 480 },
      drawer: { height: 'auto' }
    }).afterClosed$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(changed => {
        if (changed) this.message.success('Password modificata con successo!');
      });
  }
}
