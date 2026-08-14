# LineUp — Implementazione proposta per modali e drawer centralizzati

> Stato: implementato il 14 agosto 2026. La descrizione architetturale definitiva è riportata anche in `developer_notes.md`.
>
> Questo documento resta la specifica estesa della migrazione; in caso di interventi futuri va sempre confrontato con lo stato corrente del repository.

## 1. Obiettivo

Centralizzare l'apertura di tutti gli overlay dell'applicazione e sostituire le modali simulate tramite HTML/CSS con le primitive reali di Ng-Zorro:

- `NzModalService` per le modali desktop;
- `NzDrawerService` per i drawer mobile;
- `ResponsiveOverlayService` come unico punto di accesso usato dalle feature, con scelta automatica in base al breakpoint;
- componenti di contenuto indipendenti dal contenitore grafico;
- dati in ingresso e risultato in uscita tipizzati;
- gestione uniforme di focus, backdrop, tasto Escape, chiusura, animazioni, z-index e cleanup.

Il breakpoint applicativo proposto è `(max-width: 768px)`, coerente con quello già utilizzato dagli stili correnti.

## 2. Decisioni architetturali

### 2.1 Il componente va passato come classe, non come stringa

Evitare:

```ts
createModal<number>('nomeComponente', 1);
```

Usare:

```ts
this.overlay.open<NumberDialogData, number>(NumberDialogContentComponent, {
  title: 'Scegli un numero',
  data: { value: 1 }
});
```

Passare `Type<TComponent>` permette al compilatore e ad Angular di verificare il componente, mantiene il tree shaking e rende sicuri rename e refactoring.

### 2.2 Dati e risultato sono tipi distinti

- `TData`: oggetto immutabile passato al contenuto all'apertura;
- `TResult`: valore restituito esclusivamente alla conferma;
- `undefined`: overlay chiuso senza conferma.

I dati vanno sempre raggruppati in un oggetto, anche quando contengono un solo valore.

### 2.3 I contenuti non conoscono modale o drawer

Ng-Zorro usa token differenti (`NZ_MODAL_DATA` e `NZ_DRAWER_DATA`) e reference differenti (`NzModalRef` e `NzDrawerRef`). I componenti non devono importare direttamente queste primitive. Due helper condivisi nascondono la differenza:

```ts
const data = injectAppOverlayData<MyData>();
const overlayRef = injectAppOverlayRef<MyResult>();
```

### 2.4 Le feature usano la facade responsiva

Le feature non devono contenere controlli `isMobile`, media query TypeScript o chiamate parallele ai due service.

```text
Feature -> ResponsiveOverlayService
              | desktop -> AppModalService
              | mobile  -> AppDrawerService
```

`AppModalService.createModal()` e `AppDrawerService.createDrawer()` rimangono pubblici per i rari casi in cui una presentazione debba essere forzata.

### 2.5 La scelta avviene all'apertura

Se il viewport cambia mentre un form è aperto, l'overlay non viene distrutto e ricreato. Questo evita perdita di valori, doppie animazioni e duplicazione di richieste.

## 3. Struttura file prevista

```text
frontend/src/app/shared/overlay/
├── app-overlay.types.ts
├── app-overlay-injectors.ts
├── app-modal.service.ts
├── app-drawer.service.ts
├── responsive-overlay.service.ts
└── content/
    └── confirm-action/
        ├── confirm-action.component.ts
        ├── confirm-action.component.html
        └── confirm-action.component.scss

frontend/src/app/pages/match/components/
├── match-form/
├── goal-form/
└── lineup-form/

frontend/src/app/pages/account/components/password-form/
frontend/src/app/pages/reservation/components/reservation-form/
```

I nomi non devono più contenere `modal`, perché lo stesso contenuto potrà essere mostrato sia in una modale sia in un drawer.

## 4. Dipendenza esplicita Angular CDK

Ng-Zorro porta già Angular CDK nel grafo, ma l'applicazione lo utilizzerà direttamente. Va quindi dichiarato esplicitamente in `frontend/package.json` con la stessa versione minor di Angular:

```json
{
  "dependencies": {
    "@angular/cdk": "^21.2.3"
  }
}
```

La migrazione ha dichiarato `@angular/cdk@^21.2.3`, versione già risolta nel lockfile, aggiornando coerentemente anche `package-lock.json`.

## 5. Contratti condivisi

### `shared/overlay/app-overlay.types.ts`

```ts
import { Observable } from 'rxjs';

export const APP_MOBILE_OVERLAY_QUERY = '(max-width: 768px)';

export type AppOverlayAutofocus = 'auto' | 'ok' | 'cancel' | null;

export interface AppModalPresentation {
  width?: number | string;
  centered?: boolean;
}

export interface AppDrawerPresentation {
  height?: number | string;
}

export interface AppOverlayOptions<TData extends object> {
  title: string;
  data: TData;
  showClose?: boolean;
  maskClosable?: boolean;
  keyboard?: boolean;
  closeOnNavigation?: boolean;
  autofocus?: AppOverlayAutofocus;
  zIndex?: number;
  modal?: AppModalPresentation;
  drawer?: AppDrawerPresentation;
}

export interface AppOverlayRef<TResult> {
  readonly afterClosed$: Observable<TResult | undefined>;
  close(result?: TResult): void;
}

export interface AppOverlayContentRef<TResult> {
  close(result: TResult): void;
  dismiss(): void;
}

export class DefaultAppOverlayRef<TResult> implements AppOverlayRef<TResult> {
  constructor(
    readonly afterClosed$: Observable<TResult | undefined>,
    private readonly closeOverlay: (result?: TResult) => void
  ) {}

  close(result?: TResult): void {
    this.closeOverlay(result);
  }
}
```

Note:

- `data` è sempre un oggetto. Per un contenuto senza parametri usare `Record<string, never>` e `{}`.
- L'autofocus predefinito verrà impostato a `null`, evitando l'apertura automatica della tastiera mobile.
- La facade restituisce la stessa reference indipendentemente dalla tecnologia sottostante.

## 6. Helper di injection indipendenti dal contenitore

### `shared/overlay/app-overlay-injectors.ts`

```ts
import { inject } from '@angular/core';
import { NZ_DRAWER_DATA, NzDrawerRef } from 'ng-zorro-antd/drawer';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { AppOverlayContentRef } from './app-overlay.types';

export function injectAppOverlayData<TData extends object>(): TData {
  const modalData = inject(NZ_MODAL_DATA, { optional: true }) as TData | null;
  const drawerData = inject(NZ_DRAWER_DATA, { optional: true }) as TData | null;
  const data = modalData ?? drawerData;

  if (!data) {
    throw new Error('Il componente deve essere aperto tramite un AppOverlayService.');
  }

  return data;
}

export function injectAppOverlayRef<TResult>(): AppOverlayContentRef<TResult> {
  const modalRef = inject<NzModalRef<object, TResult>>(NzModalRef, { optional: true });
  const drawerRef = inject<NzDrawerRef<object, TResult>>(NzDrawerRef, { optional: true });

  if (!modalRef && !drawerRef) {
    throw new Error('Overlay reference non disponibile.');
  }

  return {
    close: (result: TResult) => {
      if (modalRef) modalRef.close(result);
      else drawerRef!.close(result);
    },
    dismiss: () => {
      if (modalRef) modalRef.close();
      else drawerRef!.close();
    }
  };
}
```

Tutta la dipendenza dai token Ng-Zorro è confinata in questo file.

## 7. Service modale

### `shared/overlay/app-modal.service.ts`

```ts
import { Injectable, Type, inject } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import {
  AppOverlayOptions,
  AppOverlayRef,
  DefaultAppOverlayRef
} from './app-overlay.types';

@Injectable({ providedIn: 'root' })
export class AppModalService {
  private readonly modal = inject(NzModalService);

  createModal<TData extends object, TResult, TComponent extends object = object>(
    component: Type<TComponent>,
    options: AppOverlayOptions<TData>
  ): AppOverlayRef<TResult> {
    const ref = this.modal.create<TComponent, TData, TResult>({
      nzContent: component,
      nzData: options.data,
      nzTitle: options.title,
      nzFooter: null,
      nzWidth: options.modal?.width ?? 512,
      nzCentered: options.modal?.centered ?? true,
      nzClosable: options.showClose ?? true,
      nzMaskClosable: options.maskClosable ?? true,
      nzKeyboard: options.keyboard ?? true,
      nzCloseOnNavigation: options.closeOnNavigation ?? true,
      nzAutofocus: options.autofocus ?? null,
      nzZIndex: options.zIndex ?? 2000,
      nzWrapClassName: 'app-modal-overlay',
      nzBodyStyle: {
        padding: '0',
        overflow: 'auto'
      }
    });

    return new DefaultAppOverlayRef<TResult>(
      ref.afterClose,
      result => ref.close(result)
    );
  }
}
```

Il service non contiene business logic e non conosce i singoli componenti.

## 8. Service drawer

### `shared/overlay/app-drawer.service.ts`

```ts
import { Injectable, Type, inject } from '@angular/core';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import {
  AppOverlayOptions,
  AppOverlayRef,
  DefaultAppOverlayRef
} from './app-overlay.types';

@Injectable({ providedIn: 'root' })
export class AppDrawerService {
  private readonly drawer = inject(NzDrawerService);

  createDrawer<TData extends object, TResult, TComponent extends object = object>(
    component: Type<TComponent>,
    options: AppOverlayOptions<TData>
  ): AppOverlayRef<TResult> {
    const ref = this.drawer.create<TComponent, object, TResult>({
      nzContent: component,
      nzData: options.data,
      nzTitle: options.title,
      nzPlacement: 'bottom',
      nzHeight: options.drawer?.height ?? 'auto',
      nzClosable: options.showClose ?? true,
      nzMaskClosable: options.maskClosable ?? true,
      nzKeyboard: options.keyboard ?? true,
      nzCloseOnNavigation: options.closeOnNavigation ?? true,
      nzZIndex: options.zIndex ?? 2000,
      nzWrapClassName: 'app-drawer-overlay',
      nzBodyStyle: {
        padding: '0',
        overflow: 'auto'
      }
    });

    return new DefaultAppOverlayRef<TResult>(
      ref.afterClose,
      result => ref.close(result)
    );
  }
}
```

Il drawer usa l'animazione nativa Ng-Zorro. Non deve ricevere animazioni CSS aggiuntive.

## 9. Facade responsiva

### `shared/overlay/responsive-overlay.service.ts`

```ts
import { Injectable, Type, inject } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { AppDrawerService } from './app-drawer.service';
import { AppModalService } from './app-modal.service';
import {
  APP_MOBILE_OVERLAY_QUERY,
  AppOverlayOptions,
  AppOverlayRef
} from './app-overlay.types';

@Injectable({ providedIn: 'root' })
export class ResponsiveOverlayService {
  private readonly breakpoints = inject(BreakpointObserver);
  private readonly modals = inject(AppModalService);
  private readonly drawers = inject(AppDrawerService);

  open<TData extends object, TResult, TComponent extends object = object>(
    component: Type<TComponent>,
    options: AppOverlayOptions<TData>
  ): AppOverlayRef<TResult> {
    if (this.breakpoints.isMatched(APP_MOBILE_OVERLAY_QUERY)) {
      return this.drawers.createDrawer<TData, TResult, TComponent>(component, options);
    }

    return this.modals.createModal<TData, TResult, TComponent>(component, options);
  }
}
```

Questa è l'API che deve essere usata normalmente dalle pagine.

## 10. Stili globali centralizzati

In `frontend/src/styles.scss` eliminare la media query che trasforma `.ant-modal` in drawer e aggiungere soltanto personalizzazione estetica, senza ridefinire animazioni o posizionamento.

```scss
.app-modal-overlay {
  .ant-modal-content {
    overflow: hidden;
    background: var(--card-bg);
    border: 0.0625rem solid var(--border-main);
    border-radius: 1.5rem;
  }

  .ant-modal-header {
    padding: 1rem 1.25rem;
    background: var(--app-bg);
    border-bottom: 0.0625rem solid var(--border-sub);
  }
}

.app-drawer-overlay {
  .ant-drawer-content-wrapper {
    max-height: 90dvh;
  }

  .ant-drawer-content {
    overflow: hidden;
    background: var(--card-bg);
    border: 0.0625rem solid var(--border-main);
    border-bottom: 0;
    border-radius: 1.5rem 1.5rem 0 0;
  }

  .ant-drawer-header {
    position: relative;
    padding: 1.25rem 1rem 0.85rem;
    background: var(--app-bg);
    border-bottom: 0.0625rem solid var(--border-sub);
  }

  .ant-drawer-header::before {
    position: absolute;
    top: 0.45rem;
    left: 50%;
    width: 2.5rem;
    height: 0.25rem;
    content: '';
    background: var(--border-main);
    border-radius: 999px;
    transform: translateX(-50%);
  }

  .ant-drawer-body {
    min-height: 0;
    padding-bottom: env(safe-area-inset-bottom, 0);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
}

.overlay-content {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.overlay-content__body {
  min-height: 0;
  padding: 1.25rem;
  overflow-y: auto;
}

.overlay-content__actions {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.25rem calc(1rem + env(safe-area-inset-bottom, 0px));
  background: var(--app-bg);
  border-top: 0.0625rem solid var(--border-sub);
}

.overlay-content__actions > button {
  flex: 1;
  min-height: 3rem;
  border-radius: 0.75rem;
  font-weight: 700;
}
```

Non devono più esistere:

- `.modal-backdrop` nei componenti;
- `.modal-container` nei componenti;
- keyframe `mobile-drawer-enter` applicati alle modali;
- media query globali che riposizionano `.ant-modal` in basso;
- `nzNoAnimation: true` usato per correggere la doppia animazione.

## 11. Conferma generica

### `shared/overlay/content/confirm-action/confirm-action.component.ts`

```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import {
  injectAppOverlayData,
  injectAppOverlayRef
} from '../../app-overlay-injectors';

export interface ConfirmActionData {
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

@Component({
  selector: 'app-confirm-action',
  standalone: true,
  imports: [NzButtonModule, NzIconModule],
  templateUrl: './confirm-action.component.html',
  styleUrl: './confirm-action.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmActionComponent {
  readonly data = injectAppOverlayData<ConfirmActionData>();
  private readonly overlayRef = injectAppOverlayRef<true>();

  confirm(): void {
    this.overlayRef.close(true);
  }

  cancel(): void {
    this.overlayRef.dismiss();
  }
}
```

### `confirm-action.component.html`

```html
<section class="confirm-content overlay-content">
  <div class="overlay-content__body">
    <div class="confirm-icon" [class.confirm-icon--danger]="data.danger">
      <nz-icon [nzType]="data.danger ? 'exclamation-circle' : 'question-circle'" />
    </div>
    <p>{{ data.message }}</p>
  </div>

  <footer class="overlay-content__actions">
    <button nz-button type="button" (click)="cancel()">
      {{ data.cancelText ?? 'Annulla' }}
    </button>
    <button
      nz-button
      type="button"
      nzType="primary"
      [nzDanger]="data.danger ?? false"
      (click)="confirm()">
      {{ data.confirmText ?? 'Conferma' }}
    </button>
  </footer>
</section>
```

Lo SCSS conserva iconografia, colori e tipografia dell'attuale `ConfirmModalComponent`, ma non overlay, posizione o animazioni.

Esempio chiamante:

```ts
private readonly overlays = inject(ResponsiveOverlayService);

chiediConfermaEliminazione(): void {
  const match = this.match();
  if (!match) return;

  this.overlays.open<ConfirmActionData, true>(ConfirmActionComponent, {
    title: 'Elimina partita',
    data: {
      message: `Sei sicuro di voler eliminare definitivamente la partita ${match.homeTeam} - ${match.awayTeam}?`,
      confirmText: 'Elimina',
      danger: true
    },
    modal: { width: 416 },
    drawer: { height: 'auto' }
  }).afterClosed$.subscribe(confirmed => {
    if (confirmed) this.eliminaPartita(match.id);
  });
}
```

Lo stesso schema sostituisce:

- eliminazione partita;
- annullamento partita;
- conclusione partita;
- cambio ruolo;
- rimozione partecipante;
- eliminazione prenotazione.

## 12. Form creazione/modifica partita

Rinominare `AddMatchModalComponent` in `MatchFormComponent` e introdurre:

```ts
export interface MatchFormDialogData {
  matchToEdit: Match | null;
}
```

Nel componente:

```ts
readonly data = injectAppOverlayData<MatchFormDialogData>();
private readonly overlayRef = injectAppOverlayRef<MatchFormData>();

get isEditMode(): boolean {
  return this.data.matchToEdit !== null;
}

handleOk(): void {
  if (this.matchForm.invalid) {
    Object.values(this.matchForm.controls).forEach(control => {
      control.markAsDirty();
      control.updateValueAndValidity({ onlySelf: true });
    });
    return;
  }

  const value = this.matchForm.getRawValue();
  if (!value.date) return;

  this.overlayRef.close({
    homeTeam: value.homeTeam.trim(),
    awayTeam: value.awayTeam.trim(),
    date: value.date
  });
}

handleCancel(): void {
  this.overlayRef.dismiss();
}
```

L'inizializzazione del form usa `data.matchToEdit`, senza `input()`, `output()` o `isConfirmLoading`. Il template conserva soltanto form e footer:

```html
<section class="overlay-content">
  <main class="overlay-content__body">
    <form nz-form [formGroup]="matchForm" nzLayout="vertical">
      <!-- stessi tre controlli attuali: casa, trasferta, data/ora -->
    </form>
  </main>

  <footer class="overlay-content__actions">
    <button nz-button type="button" (click)="handleCancel()">Annulla</button>
    <button nz-button type="button" nzType="primary"
      [disabled]="matchForm.invalid" (click)="handleOk()">
      {{ isEditMode ? 'Salva modifiche' : 'Crea partita' }}
    </button>
  </footer>
</section>
```

Apertura per creazione in `MatchComponent`:

```ts
openAddMatch(): void {
  this.overlays.open<MatchFormDialogData, MatchFormData>(MatchFormComponent, {
    title: 'Nuova partita',
    data: { matchToEdit: null },
    modal: { width: 512 },
    drawer: { height: 'auto' }
  }).afterClosed$.subscribe(result => {
    if (!result) return;

    this.matchService.createMatch(result).subscribe({
      next: () => this.message.success('Partita creata con successo!'),
      error: () => this.message.error('Errore durante la creazione della partita.')
    });
  });
}
```

Apertura per modifica in `MatchDetailComponent`:

```ts
openEditMatch(): void {
  const match = this.match();
  if (!match) return;

  this.overlays.open<MatchFormDialogData, MatchFormData>(MatchFormComponent, {
    title: 'Modifica partita',
    data: { matchToEdit: match },
    modal: { width: 512 },
    drawer: { height: 'auto' }
  }).afterClosed$.subscribe(result => {
    if (!result) return;

    this.matchService.updateMatch(match.id, result).subscribe({
      next: () => this.message.success('Partita modificata con successo!'),
      error: error => this.message.error(error?.error || 'Errore durante la modifica della partita.')
    });
  });
}
```

Da `MatchComponent` e `MatchDetailComponent` vanno eliminati segnali di visibilità, handler submit/cancel, import del vecchio componente e blocchi `@if` dal template.

## 13. Form goal

Contratti:

```ts
export interface GoalFormDialogData {
  match: Match;
}
```

Nel nuovo `GoalFormComponent`:

```ts
readonly data = injectAppOverlayData<GoalFormDialogData>();
private readonly overlayRef = injectAppOverlayRef<GoalEvent>();

readonly currentPlayers = computed(() =>
  this.goalForm.controls.isHome.value
    ? this.data.match.homePlayers ?? []
    : this.data.match.awayPlayers ?? []
);

submitGoal(): void {
  if (this.goalForm.invalid) {
    this.goalForm.markAllAsTouched();
    return;
  }

  this.overlayRef.close(this.goalForm.getRawValue() as GoalEvent);
}

cancel(): void {
  this.overlayRef.dismiss();
}
```

Il template mantiene radio squadra, select marcatore, select assist e azioni; elimina backdrop, header e `.modal-container`.

Chiamante:

```ts
openAddGoal(): void {
  const match = this.match();
  if (!match) return;

  this.overlays.open<GoalFormDialogData, GoalEvent>(GoalFormComponent, {
    title: 'Registra goal',
    data: { match },
    modal: { width: 512 },
    drawer: { height: 'auto' }
  }).afterClosed$.subscribe(goal => {
    if (!goal) return;

    this.matchService.addGoal(match.id, goal).subscribe({
      next: () => {
        this.message.success('Goal registrato con successo!');
        this.matchService.loadMatches().subscribe();
      },
      error: () => this.message.error('Errore durante la registrazione del goal.')
    });
  });
}
```

## 14. Form formazioni

Contratti:

```ts
export interface LineupFormDialogData {
  match: Match;
}

export interface LineupFormResult {
  homePlayerNames: string[];
  awayPlayerNames: string[];
}
```

Il nuovo `LineupFormComponent` conserva la logica di assegnazione e caricamento prenotazioni. Sostituisce input/output con:

```ts
readonly data = injectAppOverlayData<LineupFormDialogData>();
private readonly overlayRef = injectAppOverlayRef<LineupFormResult>();

ngOnInit(): void {
  const match = this.data.match;
  const existingHome = (match.homePlayers ?? []).map(player => player.name);
  const existingAway = (match.awayPlayers ?? []).map(player => player.name);

  this.homeTeamPlayers.set(existingHome);
  this.awayTeamPlayers.set(existingAway);

  this.reservationService.loadReservations().subscribe({
    next: reservations => {
      const unassigned = reservations
        .map(reservation => reservation.nomeCognome)
        .filter(name => !existingHome.includes(name) && !existingAway.includes(name));
      this.unassignedPlayers.set(unassigned);
    },
    error: () => this.message.error('Errore nel caricamento delle prenotazioni.')
  });
}

save(): void {
  if (this.homeTeamPlayers().length === 0 && this.awayTeamPlayers().length === 0) {
    this.message.warning('Assegna almeno un giocatore ad una delle squadre.');
    return;
  }

  this.overlayRef.close({
    homePlayerNames: this.homeTeamPlayers(),
    awayPlayerNames: this.awayTeamPlayers()
  });
}

cancel(): void {
  this.overlayRef.dismiss();
}
```

Configurazione consigliata: modale desktop `52rem`, drawer mobile massimo `90dvh`.

## 15. Password

Il cambio password è l'unico flusso attuale che mostra l'errore API dentro la modale. Per non chiudere il contenuto prima della risposta, `PasswordFormComponent` mantiene questa operazione di dominio al proprio interno.

```ts
type PasswordFormDialogData = Record<string, never>;

readonly data = injectAppOverlayData<PasswordFormDialogData>();
private readonly overlayRef = injectAppOverlayRef<true>();
private readonly authService = inject(AuthService);

readonly saving = signal(false);
readonly errorMessage = signal('');

save(): void {
  this.errorMessage.set('');

  if (this.nuovaPassword.length < 6) {
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
```

Chiamante:

```ts
apriModificaPassword(): void {
  this.overlays.open<Record<string, never>, true>(PasswordFormComponent, {
    title: 'Modifica password',
    data: {},
    maskClosable: false,
    modal: { width: 480 },
    drawer: { height: 'auto' }
  }).afterClosed$.subscribe(changed => {
    if (changed) this.message.success('Password modificata con successo!');
  });
}
```

`AccountComponent` non avrà più bisogno di `ViewContainerRef` per questo flusso.

## 16. Prenotazione di un'altra persona

Contratti:

```ts
export interface ReservationFormDialogData {
  availablePeople: readonly {
    id: string;
    nomeCognome: string;
  }[];
}

export interface ReservationFormResult {
  nomeCognome: string;
}
```

`ReservationFormComponent` possiede form e filtro autocomplete:

```ts
readonly data = injectAppOverlayData<ReservationFormDialogData>();
private readonly overlayRef = injectAppOverlayRef<ReservationFormResult>();
private readonly fb = inject(NonNullableFormBuilder);

readonly form = this.fb.group({
  nomeCognome: ['', Validators.required]
});

readonly query = toSignal(this.form.controls.nomeCognome.valueChanges, {
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
```

Chiamante:

```ts
openAddOtherPerson(): void {
  this.overlays.open<ReservationFormDialogData, ReservationFormResult>(
    ReservationFormComponent,
    {
      title: 'Prenota altra persona',
      data: { availablePeople: this.getAvailableRegisteredUsers() },
      autofocus: null,
      modal: { width: 500 },
      drawer: { height: 'auto' }
    }
  ).afterClosed$.subscribe(result => {
    if (!result) return;

    this.reservationService.addReservation(result).subscribe({
      next: () => this.message.success('Prenotazione effettuata con successo!'),
      error: error => this.message.error(error.error || 'Errore durante la prenotazione.')
    });
  });
}
```

Vanno rimossi da `ReservationComponent`:

- `NzModalService`;
- `TemplateRef`;
- `validateForm` e sottoscrizione `statusChanges`;
- `<ng-template #modalTpl>`;
- `nzNoAnimation` e l'adattamento CSS delle modali Ng-Zorro.

L'autofocus rimane disabilitato dalla configurazione comune e il drawer usa una sola animazione nativa.

## 17. Gestione errori e loading

Regola proposta:

- validazione form: nel componente contenuto;
- chiamate CRUD ordinarie: nel chiamante dopo il risultato;
- operazioni che devono mantenere aperto il form in caso di errore: nel componente contenuto;
- toast globali: preferibilmente nel chiamante;
- errori specifici del campo/form: nel contenuto.

Per una fase successiva si potrà aggiungere a `AppOverlayOptions` una callback asincrona `beforeClose`, ma non è necessaria per completare questa migrazione.

## 18. Cleanup nei componenti chiamanti

Dopo la migrazione eliminare:

```ts
isAddMatchModalVisible
isAddGoalModalVisible
isSetupModalVisible
isEditMatchModalVisible
isDeleteModalVisible
selectedReservationToDelete // se non serve più fuori dalla conferma
```

Eliminare anche:

- import dei vecchi componenti `*ModalComponent` dagli array `imports`;
- `ViewContainerRef` usato esclusivamente per creare modali;
- sottoscrizioni manuali `confirmSub` / `cancelSub`;
- blocchi template `@if (...) { <app-...-modal> }`;
- `ConfirmModalComponent`, al termine della migrazione;
- cartelle dei vecchi componenti modale dopo aver verificato che non abbiano più riferimenti.

Ogni sottoscrizione a `afterClosed$` fatta da componenti di pagina deve usare `takeUntilDestroyed()` quando la pagina potrebbe essere distrutta prima della chiusura dell'overlay.

## 19. Caso dettaglio partita

`MatchDetailComponent` è attualmente usato dalla pagina calendario con `[isModal]="false"`. Non va trasformato automaticamente in overlay in questa migrazione: è una vista integrata nella pagina.

Si può successivamente eliminare il ramo storico `isModal=true` se una ricerca finale conferma che non esistono altri chiamanti. Questa pulizia va tenuta separata dalla migrazione delle azioni interne.

## 20. Test da aggiungere

### `app-modal.service.spec.ts`

- passa `nzContent`, `nzData` e titolo corretti;
- usa `nzAutofocus: null` come default;
- mappa `afterClose` in `afterClosed$`;
- `AppOverlayRef.close(result)` inoltra il risultato.

### `app-drawer.service.spec.ts`

- forza `nzPlacement: 'bottom'`;
- non disabilita l'animazione nativa;
- applica altezza e opzioni di chiusura;
- mappa correttamente il risultato.

### `responsive-overlay.service.spec.ts`

```ts
it('usa il drawer sotto 768px');
it('usa la modale sopra 768px');
it('decide una sola volta al momento dell apertura');
```

### Test dei contenuti

- form invalido non chiude;
- conferma chiude con DTO tipizzato;
- annullamento chiude con `undefined`;
- prenotazione non riceve focus automatico;
- errore cambio password resta visibile senza chiusura;
- cleanup automatico alla distruzione del chiamante.

## 21. Ordine di implementazione

1. Verificare repository e dipendenze rispetto a questo documento.
2. Aggiungere Angular CDK come dipendenza diretta.
3. Creare contratti, helper e tre service.
4. Aggiungere test infrastrutturali.
5. Migrare `ConfirmModalComponent` e tutti i suoi chiamanti.
6. Migrare password.
7. Migrare prenotazione altra persona.
8. Migrare creazione/modifica partita.
9. Migrare goal.
10. Migrare formazioni.
11. Rimuovere rendering condizionale e creazione manuale.
12. Eliminare CSS e animazioni dei vecchi contenitori.
13. Verificare desktop e mobile, inclusi tema chiaro/scuro e safe area.
14. Eseguire typecheck, lint, test e build di produzione.
15. Aggiornare `developer_notes.md`, perché cambia l'architettura condivisa degli overlay.

## 22. Comandi finali di verifica

```bash
cd frontend
npm run typecheck
npm run lint
npm run test:ci
npm run build:production
```

La migrazione non sarà considerata completa finché una ricerca non restituirà più aperture manuali non motivate:

```bash
rg -n "createComponent\(|NzModalService|modal\.create|is.*ModalVisible|modal-backdrop|modal-container" frontend/src/app
```

Le eventuali occorrenze residue dovranno essere analizzate singolarmente, non eliminate meccanicamente.

## 23. Criteri di accettazione

- Su desktop ogni flusso usa una vera modale Ng-Zorro.
- Su viewport mobile ogni stesso flusso usa un vero drawer Ng-Zorro dal basso.
- Non sono presenti due animazioni sovrapposte.
- Il drawer prenotazione non focalizza automaticamente l'input.
- Tutti i contenuti ricevono dati tramite oggetti tipizzati.
- Tutti i risultati sono tipizzati e distinguibili dall'annullamento.
- Nessuna feature crea manualmente componenti overlay con `ViewContainerRef`.
- Nessuna feature duplica il controllo del breakpoint.
- Nessun componente contenuto possiede backdrop o posizionamento fixed.
- Tema chiaro/scuro, CTA con `--green-button-text` e safe area restano coerenti.
- Typecheck, test e build di produzione passano.
