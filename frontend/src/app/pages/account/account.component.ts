import { Component, signal, computed, inject, effect, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService } from 'src/app/shared/service/auth.service';
import { PasswordModalComponent } from 'src/app/shared/component/password-modal/password-modal.component';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css'],
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
  private viewContainerRef = inject(ViewContainerRef);

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
    const componentRef = this.viewContainerRef.createComponent(PasswordModalComponent);
    
    componentRef.instance.isVisible = true;

    // Sottoscrizione all'evento di conferma
    const confirmSub = componentRef.instance.confirm.subscribe((nuovaPassword: string) => {
      this.salvando.set(true);

      this.authService.cambiaPassword(nuovaPassword).subscribe({
        next: () => {
          this.message.success('Password modificata con successo!');
          this.salvando.set(false);
          confirmSub.unsubscribe();
          cancelSub.unsubscribe();
          componentRef.destroy();
        },
        error: (err) => {
          console.error(err);
          // Mostra l'errore del server direttamente nella modale per dare feedback
          componentRef.instance.errorMessage = err.error || "Errore durante il salvataggio.";
          this.salvando.set(false);
        }
      });
    });

    // Sottoscrizione all'evento di annullamento
    const cancelSub = componentRef.instance.cancel.subscribe(() => {
      confirmSub.unsubscribe();
      cancelSub.unsubscribe();
      componentRef.destroy();
    });
  }
}
