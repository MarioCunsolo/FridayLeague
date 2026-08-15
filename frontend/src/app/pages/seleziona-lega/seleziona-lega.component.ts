import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/shared/service/auth.service';
import { LegaService } from 'src/app/shared/service/lega.service';
import { NzMessageService } from 'ng-zorro-antd/message';

export interface LeagueTypeOption {
  id: number;
  code: string;
  name: string;
  icon: string;
  badge: string;
  shortDesc: string;
  longDesc: string;
}

@Component({
  selector: 'app-seleziona-lega',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule
  ],
  templateUrl: './seleziona-lega.component.html',
  styleUrls: ['./seleziona-lega.component.scss']
})
export class SelezionaLegaComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  public authService = inject(AuthService);
  private legaService = inject(LegaService);
  private message = inject(NzMessageService);

  // Lista delle tipologie di lega disponibili
  leagueTypes: LeagueTypeOption[] = [
    {
      id: 1,
      code: 'PARTITA_SINGOLA',
      name: 'Partita Singola',
      icon: 'usergroup-add',
      badge: 'Standard',
      shortDesc: 'Match singoli a due squadre con prenotazione libera',
      longDesc: 'Lega classica per match singoli a due squadre. I giocatori prenotano autonomamente il loro posto per disputare la prossima partita programmata.'
    },
    {
      id: 2,
      code: 'CAMPIONATO',
      name: 'Campionato',
      icon: 'trophy',
      badge: 'Girone Unico',
      shortDesc: 'Campionato a scontri diretti tutti contro tutti',
      longDesc: 'Campionato strutturato su un numero prefissato di squadre. Tutte le squadre si affrontano in scontri diretti e vince chi accumula più punti in classifica.'
    },
    {
      id: 3,
      code: 'TORNEO',
      name: 'Torneo',
      icon: 'appstore',
      badge: 'Gironi & Playoff',
      shortDesc: 'Torneo con fase a gironi ed eliminazione diretta',
      longDesc: 'Torneo articolato in più gironi iniziali. Le squadre si sfidano nei gironi per qualificarsi alla fase finale a eliminazione diretta.'
    }
  ];

  // Stato per gestire quale vista visualizzare: 'none' | 'create' | 'join'
  activeForm = signal<'none' | 'create' | 'join'>('none');
  
  loadingCreate = signal(false);
  loadingJoin = signal(false);
  errorMessage = signal<string | null>(null);

  // Tipo lega selezionato per la creazione
  selectedTipoLegaId = signal<number>(1);

  // Opzioni rapide per numero di squadre e gironi
  squadreOptions = [4, 6, 8, 10, 12, 16];
  gironiOptions = [1, 2, 4, 8];
  dimensioniSquadraOptions = [5, 6, 7, 8, 11];

  // Form Reattivo per Creare una Lega
  createForm: FormGroup<{
    nome: FormControl<string>;
    descrizione: FormControl<string>;
    tipoLegaId: FormControl<number>;
    numeroSquadre: FormControl<number | null>;
    numeroGironi: FormControl<number | null>;
    dimensioneSquadra: FormControl<number | null>;
  }>;

  // Form Reattivo per Partecipare a una Lega
  joinForm: FormGroup<{
    codice: FormControl<string>;
  }>;

  constructor() {
    this.createForm = this.fb.nonNullable.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      descrizione: [''],
      tipoLegaId: [1, [Validators.required]],
      numeroSquadre: [4 as number | null],
      numeroGironi: [2 as number | null],
      dimensioneSquadra: [7 as number | null]
    });

    this.joinForm = this.fb.nonNullable.group({
      codice: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9]{6,8}$/)]]
    });
  }

  /**
   * Seleziona il tipo di lega da creare.
   */
  selectTipoLega(tipoId: number): void {
    if (tipoId !== 1) {
      return;
    }

    this.selectedTipoLegaId.set(tipoId);
    this.createForm.controls.tipoLegaId.setValue(tipoId);
  }

  /**
   * Imposta velocemente il numero di squadre per il Campionato.
   */
  setNumeroSquadre(num: number): void {
    this.createForm.controls.numeroSquadre.setValue(num);
  }

  /**
   * Imposta velocemente il numero di gironi per il Torneo.
   */
  setNumeroGironi(num: number): void {
    this.createForm.controls.numeroGironi.setValue(num);
  }

  setDimensioneSquadra(num: number): void {
    this.createForm.controls.dimensioneSquadra.setValue(num);
  }

  /**
   * Cambia la modalità del form ('create' | 'join').
   */
  selectAction(action: 'create' | 'join'): void {
    this.activeForm.set(action);
    this.errorMessage.set(null);
    this.selectedTipoLegaId.set(1);
    this.createForm.reset({
      nome: '',
      descrizione: '',
      tipoLegaId: 1,
      numeroSquadre: 4,
      numeroGironi: 2,
      dimensioneSquadra: 7
    });
    this.joinForm.reset();
  }

  /**
   * Ripristina lo stato iniziale con le due card o torna alla Home se l'utente ha già una lega.
   */
  goBack(): void {
    if (this.activeForm() === 'none') {
      const user = this.authService.currentUser();
      if (user && user.legaId) {
        this.router.navigate(['/home']);
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
      const { nome, descrizione, tipoLegaId, numeroSquadre, numeroGironi, dimensioneSquadra } = this.createForm.value;

      if (tipoLegaId === 1 && (!dimensioneSquadra || dimensioneSquadra < 1 || dimensioneSquadra > 50)) {
        this.errorMessage.set('Per una Partita Singola è necessario indicare una dimensione squadra valida (da 1 a 50 giocatori).');
        return;
      }

      if (tipoLegaId === 2 && (!numeroSquadre || numeroSquadre < 2)) {
        this.errorMessage.set('Per un Campionato è necessario specificare un numero di squadre valido (almeno 2).');
        return;
      }

      if (tipoLegaId === 3 && (!numeroGironi || numeroGironi < 1)) {
        this.errorMessage.set('Per un Torneo è necessario specificare un numero di gironi valido (almeno 1).');
        return;
      }

      this.loadingCreate.set(true);
      this.errorMessage.set(null);

      const squadreVal = tipoLegaId === 2 ? numeroSquadre : null;
      const gironiVal = tipoLegaId === 3 ? numeroGironi : null;
      const dimensioneSquadraVal = tipoLegaId === 1 ? dimensioneSquadra : null;

      this.legaService.creaLega({
        nomeLega: nome!,
        descrizione: descrizione || undefined,
        tipoLegaId: tipoLegaId!,
        numeroSquadre: squadreVal,
        numeroGironi: gironiVal,
        dimensioneSquadra: dimensioneSquadraVal
      }).subscribe({
        next: () => {
          this.loadingCreate.set(false);
          this.message.success('Lega creata con successo!');
          this.router.navigate(['/home']);
        },
        error: (err) => {
          this.loadingCreate.set(false);
          const msg = err?.error || 'Errore durante la creazione della lega. Riprova più tardi.';
          this.errorMessage.set(typeof msg === 'string' ? msg : 'Errore durante la creazione della lega.');
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

      this.legaService.partecipaLega({ codiceLega: codice! }).subscribe({
        next: () => {
          this.loadingJoin.set(false);
          this.message.success('Sei entrato nella lega con successo!');
          this.router.navigate(['/home']);
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
