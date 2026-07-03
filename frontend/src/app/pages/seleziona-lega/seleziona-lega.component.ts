import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/shared/service/auth.service';

@Component({
  selector: 'app-seleziona-lega',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule
  ],
  templateUrl: './seleziona-lega.component.html',
  styleUrls: ['./seleziona-lega.component.css']
})
export class SelezionaLegaComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  public authService = inject(AuthService);

  // Stato per gestire quale vista visualizzare: 'none' | 'create' | 'join'
  activeForm = signal<'none' | 'create' | 'join'>('none');
  
  loadingCreate = signal(false);
  loadingJoin = signal(false);
  errorMessage = signal<string | null>(null);

  // Form Reattivo per Creare una Lega
  createForm: FormGroup<{
    nome: FormControl<string>;
    descrizione: FormControl<string>;
  }>;

  // Form Reattivo per Partecipare a una Lega
  joinForm: FormGroup<{
    codice: FormControl<string>;
  }>;

  constructor() {
    this.createForm = this.fb.nonNullable.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      descrizione: ['']
    });

    this.joinForm = this.fb.nonNullable.group({
      codice: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9]{6,8}$/)]]
    });
  }

  /**
   * Cambia la modalità del form.
   */
  selectAction(action: 'create' | 'join'): void {
    this.activeForm.set(action);
    this.errorMessage.set(null);
    this.createForm.reset();
    this.joinForm.reset();
  }

  /**
   * Ripristina lo stato iniziale con le due card o torna alla Home se l'utente ha già una lega.
   */
  goBack(): void {
    if (this.activeForm() === 'none') {
      const user = this.authService.currentUser();
      if (user && user.legaId) {
        this.router.navigate(['/']);
      }
    } else {
      this.activeForm.set('none');
      this.errorMessage.set(null);
    }
  }

  /**
   * Invia il form di creazione della lega.
   */
  submitCreate(): void {
    if (this.createForm.valid) {
      this.loadingCreate.set(true);
      this.errorMessage.set(null);
      const { nome, descrizione } = this.createForm.value;
      
      this.authService.creaLega(nome!, descrizione).subscribe({
        next: () => {
          this.loadingCreate.set(false);
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.loadingCreate.set(false);
          this.errorMessage.set('Errore durante la creazione della lega. Riprova più tardi.');
          console.error(err);
        }
      });
    } else {
      this.markFormDirty(this.createForm);
    }
  }

  /**
   * Invia il form per unirsi a una lega.
   */
  submitJoin(): void {
    if (this.joinForm.valid) {
      this.loadingJoin.set(true);
      this.errorMessage.set(null);
      const { codice } = this.joinForm.value;

      this.authService.partecipaLega(codice!).subscribe({
        next: () => {
          this.loadingJoin.set(false);
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.loadingJoin.set(false);
          this.errorMessage.set('Codice non valido o lega non trovata. Riprova.');
          console.error(err);
        }
      });
    } else {
      this.markFormDirty(this.joinForm);
    }
  }

  /**
   * Effettua il logout se l'utente vuole uscire o cambiare account.
   */
  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        this.router.navigate(['/login']);
      }
    });
  }

  /**
   * Marca tutti i controlli del form come dirty per mostrare gli errori di validazione.
   */
  private markFormDirty(form: FormGroup): void {
    Object.values(form.controls).forEach(control => {
      if (control.invalid) {
        control.markAsDirty();
        control.updateValueAndValidity({ onlySelf: true });
      }
    });
  }
}
