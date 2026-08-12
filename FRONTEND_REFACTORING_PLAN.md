# Analisi e piano di miglioramento del frontend LineUp

Data dell'analisi: 12 agosto 2026  
Ambito: solo `frontend/`  
Versione rilevata: Angular 21.2.x, TypeScript 5.9.x, RxJS 7.8.x, Ng-Zorro 21.1.x

## 1. Obiettivo

Questo documento raccoglie le modifiche consigliate per rendere il frontend più corretto, tipizzato, manutenibile, performante, accessibile e semplice da testare, mantenendo invariati i vincoli funzionali descritti in `developer_notes.md`.

L'applicazione usa già diversi strumenti moderni di Angular: componenti standalone, Signals, `computed`, `effect`, functional interceptor e functional guards. Il refactoring non deve quindi riscrivere tutto, ma consolidare queste scelte, eliminare le parti ancora ibride e correggere prima i difetti che possono produrre comportamenti errati.

## 2. Stato attuale rilevato

| Area | Stato |
|---|---|
| Bootstrap | Standalone, ma ancora basato su `BrowserModule`, `AppRoutingModule` e `APP_INITIALIZER` deprecato |
| Routing | Quasi tutte le pagine sono caricate eager; solo `account` usa `loadComponent` |
| Tipizzazione | TypeScript e template strict sono attivi, ma molti contratti API usano `any` |
| Stato | Signals presenti, con chiamate HTTP avviate dentro `effect` e `subscribe` distribuite nei componenti |
| Permessi | Regole corrette in larga parte, ma duplicate in servizi, guardie e pagine |
| UI | Ng-Zorro, Bootstrap, Font Awesome locale, Font Awesome CDN e CSS custom convivono |
| Stili | Circa 10.500 righe complessive tra TS, HTML e SCSS; alcuni componenti superano 300–500 righe di stile |
| Test | Solo quattro spec, prevalentemente smoke test; una spec contiene ancora riferimenti ad `angular16-base` |
| Qualità | Manca uno script di lint, manca E2E, manca una pipeline CI frontend esplicita |
| Type-check | `npx tsc --noEmit --project tsconfig.app.json` passa |
| Test runner | Il comando headless termina con exit code 134 durante `Building`; la pipeline test va stabilizzata prima del refactoring |

## 3. Livelli di priorità

- **P0 – Correttezza:** possibile bug, perdita di coerenza o dato visualizzato in modo errato.
- **P1 – Architettura:** debito tecnico che rallenta ogni sviluppo successivo.
- **P2 – Prestazioni e UX:** migliora tempi, feedback, accessibilità e qualità percepita.
- **P3 – Evoluzione:** attività utili dopo aver stabilizzato il nucleo dell'app.

## 4. Problemi prioritari da correggere

### P0.1 – UUID trattati come numeri

La guida stabilisce che `UserId` e `LegaId` sono UUID, quindi `string` in TypeScript. Attualmente:

- `ReservationComponent.registeredUsers` dichiara `id: number` ma riceve `ParticipantDto.UserId`, che è un UUID;
- `GestisciPartecipantiComponent.getCurrentUserId()` restituisce `number` e usa `0` come fallback, mentre `currentUser.id` è un UUID.

Modifica:

- introdurre un alias `type UUID = string`;
- tipizzare tutti gli identificativi utente/lega come `UUID`;
- eliminare fallback numerici come `0` e usare `null` quando l'identità non è disponibile;
- aggiungere test sui confronti tra utente corrente e partecipante.

### P0.2 – Stato iniziale di `MatchService` popolato con dati fittizi

`MatchService` contiene oltre 250 righe di partite mock nello stato runtime. Se la richiesta HTTP fallisce o non è ancora terminata, l'interfaccia può mostrare dati inventati come se fossero reali.

Modifica:

- inizializzare lo stato con `signal<Match[]>([])`;
- spostare i dati mock in fixture di test o Storybook, se verrà adottato;
- distinguere esplicitamente gli stati `idle`, `loading`, `success`, `empty` ed `error`;
- non mantenere dati della lega precedente durante un cambio lega o un errore di caricamento.

### P0.3 – Race condition durante il cambio lega

`LegaService.cambiaLega()` esegue internamente `subscribe()`, mentre `LayoutComponent` naviga subito verso `/home`. La pagina può quindi caricare dati con la lega precedente.

Modifica:

- fare restituire `Observable<User>` da `cambiaLega()`;
- aggiornare l'utente nel `tap` del servizio;
- nel layout attendere il completamento prima di navigare;
- disabilitare il selettore durante la richiesta;
- in errore ripristinare il valore precedente e mostrare un messaggio;
- resettare gli store dipendenti dalla lega e ricaricarli solo dopo il nuovo `legaId`.

### P0.4 – Apertura dettaglio partita non sincronizzata con il caricamento dati

`MatchComponent` legge `matchId` dai query parameter una sola volta. Se le partite non sono ancora arrivate dal backend, `getMatchById()` non trova la partita e la modale non viene più aperta.

Modifica:

- rappresentare `matchId` come Signal derivato dal router;
- calcolare `selectedMatch` combinando parametro e store partite;
- aprire il dettaglio quando entrambi sono disponibili;
- gestire ID inesistenti con messaggio e pulizia del query parameter;
- valutare una rotta dedicata `/calendario/:matchId` per URL più chiari e navigazione browser corretta.

### P0.5 – Sottoscrizioni duplicate nella modale prenotazioni

Ogni chiamata a `openAddOthersModal()` crea nuove sottoscrizioni a `valueChanges` e `statusChanges`. Dopo più aperture, gli stessi eventi vengono elaborati più volte.

Modifica:

- creare le pipeline una sola volta nel costruttore, oppure limitarle alla vita della modale;
- usare `takeUntilDestroyed()` per le sottoscrizioni legate al componente;
- usare un segnale/computed per le opzioni filtrate e per la validità del form;
- garantire la distruzione delle sottoscrizioni specifiche quando la modale viene chiusa.

### P0.6 – Contratto incompleto per le prenotazioni

Il backend restituisce anche `ReservationDto.Id`, ma l'interfaccia frontend lo omette. La cancellazione usa soltanto `playerId`, che è nullo per una prenotazione inserita con nome libero. In quel caso il frontend non può cancellare la prenotazione.

Modifica frontend:

- aggiungere `id: number` al DTO di risposta;
- separare `ReservationDto` da `CreateReservationRequest`;
- non inviare `dataOra`, perché viene valorizzata dal server;
- mostrare azioni coerenti con l'identificativo realmente cancellabile.

Dipendenza backend da concordare:

- preferire `DELETE /reservations/{reservationId}` e verificare i permessi lato server;
- in alternativa vietare esplicitamente prenotazioni non associate a un utente registrato.

### P0.7 – Registrazione e sessione incoerenti

`AuthService.register()` salva token e utente, ma `RegisterComponent` porta poi alla pagina di login. L'utente risulta tecnicamente autenticato mentre vede un nuovo form di accesso.

Modifica: scegliere un solo comportamento di prodotto.

- Opzione consigliata: se il backend restituisce token e utente, navigare a `/seleziona-lega` o `/home` senza un secondo login.
- Opzione alternativa: il backend non restituisce una sessione dopo la registrazione e il frontend non salva alcun token.

La decisione va coperta da un test di integrazione.

### P0.8 – Pipeline di test non affidabile

La suite headless non arriva all'esecuzione dei test nell'ambiente analizzato. Inoltre `app.component.spec.ts` cerca markup che non esiste più.

Modifica:

- ripristinare un comando test ripetibile e non interattivo;
- sostituire le aspettative obsolete;
- mockare Router, HttpClient e servizi richiesti dai componenti standalone;
- impedire merge se type-check, lint, unit test o build falliscono.

## 5. Architettura Angular 21 consigliata

### 5.1 Bootstrap standalone completo

Creare:

- `src/app/app.config.ts` per i provider applicativi;
- `src/app/app.routes.ts` per le rotte.

Modifiche:

- sostituire `APP_INITIALIZER` con `provideAppInitializer(() => inject(AuthService).initSession())`;
- sostituire `AppRoutingModule` con `provideRouter(routes, ...)`;
- rimuovere `importProvidersFrom(BrowserModule, AppRoutingModule)`;
- mantenere `provideHttpClient(withInterceptors([authInterceptor]))`;
- mantenere locale italiano e provider Ng-Zorro nel file di configurazione;
- valutare `withComponentInputBinding()` per parametri di rotta tipizzati;
- rimandare il passaggio zoneless finché componenti e librerie non sono verificati con test adeguati.

Nota: `APP_INITIALIZER` è deprecato nelle versioni Angular installate; `provideAppInitializer` è già disponibile nel progetto.

### 5.2 Routing per feature e lazy loading

La landing page principale può restare eager. Le altre aree dovrebbero essere lazy:

- autenticazione: login e registrazione;
- selezione lega;
- prenotazioni;
- calendario e dettaglio partita;
- classifiche e profilo;
- account;
- amministrazione lega, con rotte figlie lazy.

Struttura suggerita:

```text
src/app/
  app.config.ts
  app.routes.ts
  core/
    auth/
    http/
    authorization/
    config/
  shared/
    ui/
    models/
    utilities/
  features/
    auth/
    leagues/
    reservations/
    matches/
    stats/
    profile/
    account/
    league-admin/
```

Usare `loadComponent` per pagine singole e `loadChildren` con file `*.routes.ts` per feature con più schermate. Evitare livelli di lazy loading eccessivi che aggiungerebbero richieste senza un reale vantaggio.

### 5.3 Change detection

In Angular 21 `OnPush` non è ancora il default del progetto. Applicarlo gradualmente ai componenti, partendo da quelli presentazionali e già basati su Signals.

Modifica:

- aggiungere `changeDetection: ChangeDetectionStrategy.OnPush`;
- aggiornare lo stato con strutture immutabili;
- evitare mutazioni in-place di input o array;
- misurare il risultato prima e dopo sui componenti più grandi.

### 5.4 Sintassi template moderna

Il progetto usa sia `@if`/`@for` sia `*ngIf`/`*ngFor`.

Modifica:

- uniformare i template al control flow moderno;
- usare chiavi stabili come `id`, `userId` o combinazioni di dominio nei `track`;
- usare `$index` solo per collezioni realmente statiche;
- aggiungere `@empty` alle liste con stato vuoto;
- rimuovere `CommonModule` dove non è più necessario dopo la migrazione.

## 6. Contratti, modelli e tipizzazione

### 6.1 Separare DTO API e modelli UI

Le date JSON arrivano come stringhe, non come `Date`. Attualmente `Match.date` e `Reservation.dataOra` sono dichiarate direttamente come `Date`, costringendo a conversioni parziali e poco visibili.

Creare contratti distinti:

```text
models/api/
  auth.models.ts
  league.models.ts
  participant.models.ts
  reservation.models.ts
  match.models.ts
  stats.models.ts
  activity-log.models.ts
models/domain/
  role.ts
  match-status.ts
  match.vm.ts
```

Esempi da introdurre:

- `UserDto`, `LeagueDto`, `AuthResponse`;
- `LoginRequest`, `RegisterRequest`, `UpdateProfileRequest`;
- `ParticipantDto`, `ActivityLogDto`;
- `ReservationDto`, `CreateReservationRequest`;
- `MatchDto`, `CreateMatchRequest`, `UpdateMatchRequest`, `GoalEventDto`;
- `LeagueRole` come union type o enum;
- `LeagueTypeCode` e `ActivityAction` come union type;
- `ApiError` normalizzato.

### 6.2 Eliminare `any`

I punti principali sono:

- `AuthService` e il Signal dell'utente;
- `LegaService`;
- tutte le guardie che leggono utente e lega;
- gestione partecipanti;
- registro attività;
- impostazioni lega;
- callback di errore HTTP;
- firme generiche di form e payload.

Regola: usare `unknown` per dati non affidabili e restringere il tipo; non sostituire semplicemente `any` con cast forzati.

### 6.3 Mapper centralizzati

Creare funzioni pure per:

- convertire ISO string in `Date`;
- mappare status backend in `MatchStatus`;
- mappare DTO in view model;
- formattare ruolo e azione attività;
- normalizzare errori HTTP.

I mapper devono avere test unitari e non vivere nei componenti.

### 6.4 Form strettamente tipizzati

Login, registrazione e selezione lega sono già in buona parte tipizzati. Uniformare:

- account;
- aggiunta partita;
- aggiunta goal;
- cambio password;
- prenotazione di terzi.

Preferire `NonNullableFormBuilder` quando il dominio non ammette `null`. Evitare `form.value` se produce proprietà opzionali; usare `getRawValue()` dopo la validazione.

## 7. Servizi, stato e flussi reattivi

### 7.1 Responsabilità dei servizi

I servizi HTTP devono restituire Observable tipizzati e non effettuare `subscribe()` internamente, salvo store progettati esplicitamente per gestire un comando.

Separazione consigliata:

- client API: costruzione URL e richieste HTTP;
- facade/store di feature: stato, loading, error e aggiornamenti ottimistici;
- componenti: eventi UI e presentazione.

### 7.2 GET reattive

Per letture dipendenti da Signals, come statistiche per stagione o dati per lega, usare una delle due strategie:

- `httpResource`/resource API disponibile in Angular 21.2 del progetto, dopo una prova mirata;
- `toObservable(signal).pipe(switchMap(...), takeUntilDestroyed())` quando serve controllo RxJS più esplicito.

Benefici:

- cancellazione automatica della richiesta precedente;
- stato loading/error disponibile;
- assenza di `subscribe()` annidati dentro `effect`;
- nessun risultato obsoleto se stagione, utente o lega cambiano rapidamente.

Continuare a usare `HttpClient` tradizionale per POST, PUT e DELETE.

### 7.3 Pulizia delle sottoscrizioni

Applicare `takeUntilDestroyed()` a:

- `queryParams` in login, calendario e classifiche;
- `valueChanges` e `statusChanges` dei form;
- stream a vita lunga;
- output di componenti creati programmaticamente, se si mantiene l'approccio attuale.

Le Observable HTTP finite non perdono memoria dopo il completamento, ma vanno comunque composte in modo da cancellare richieste non più rilevanti alla distruzione della pagina.

### 7.4 Stato per lega

Ogni store di dati di dominio deve essere associato al `legaId` che lo ha generato.

Modifica:

- registrare il `leagueId` corrente nello stato;
- svuotare partite, prenotazioni, classifiche e partecipanti al cambio lega;
- ignorare risposte tardive appartenenti alla lega precedente;
- evitare cache cross-tenant nel browser.

## 8. Autenticazione e sicurezza

### 8.1 Servizio sessione

Modifica:

- tipizzare `currentUser` come `UserDto | null`;
- estrarre un `TokenStorageService` per local/session storage;
- eliminare ogni riferimento legacy a `mock_user_lega` dopo aver verificato che non serva a migrazioni reali;
- usare `firstValueFrom()` in `initSession()` invece di costruire manualmente una Promise con `subscribe`;
- distinguere token assente, token scaduto, rete non disponibile e server non disponibile;
- non cancellare automaticamente una sessione valida per un errore di rete temporaneo senza una decisione di prodotto esplicita.

### 8.2 Interceptor

Modifica:

- allegare il token solo alle richieste dirette a `environment.apiUrl`;
- aggiungere gestione centralizzata di `401` e, se utile, `403`;
- evitare loop di logout se fallisce l'endpoint di logout;
- normalizzare gli errori in un formato unico;
- non scrivere dati sensibili nei log browser.

### 8.3 Memorizzazione JWT

Lo storage web è accessibile a JavaScript e aumenta l'impatto di una vulnerabilità XSS. Il miglioramento completo richiede collaborazione con il backend:

- access token breve in memoria;
- refresh token in cookie `HttpOnly`, `Secure`, `SameSite`;
- rotazione/revoca del refresh token;
- protezione CSRF coerente con la strategia cookie.

Finché non viene introdotto questo flusso, mantenere l'attuale comportamento “Ricordami”, rafforzare CSP e dipendenze e non memorizzare altre informazioni sensibili.

### 8.4 Configurazione runtime Railway

`runtime-config.js` deve contenere solo configurazione pubblica. Non inserire JWT key, password o segreti.

Modifica:

- validare `API_URL` all'avvio;
- in produzione mostrare un errore di configurazione chiaro se manca, invece di usare silenziosamente un dominio di fallback potenzialmente errato;
- testare URL con e senza slash finale;
- aggiungere test smoke sull'endpoint `/health` e sulla raggiungibilità API dal dominio frontend.

### 8.5 Sicurezza delle dipendenze e del documento HTML

Modifica:

- rimuovere Font Awesome da CDN, già duplicato dalla dipendenza locale;
- preferire asset self-hosted per font e icone;
- impostare una Content Security Policy compatibile con Railway/Nginx;
- mantenere Angular e Ng-Zorro sulle patch compatibili più recenti dopo test automatici;
- eseguire audit dipendenze in CI;
- ricordare che guardie e pulsanti nascosti non sostituiscono mai i controlli autorizzativi backend.

## 9. Autorizzazioni e ruoli

Le regole sono replicate in `AuthService`, guardie, prenotazioni, gestione partecipanti e dettaglio partita.

Creare un `AuthorizationService` puro con metodi come:

- `activeMembership(user)`;
- `activeRole(user)`;
- `canAccessLeagueSettings(user)`;
- `canViewActivityLog(user)`;
- `canManageParticipant(actor, target)`;
- `canChangeParticipantRole(actor, target, newRole)`;
- `canDeleteReservation(actor, reservation)`;
- `canManageMatch(actor)`.

Le guardie e i componenti devono usare la stessa fonte. Aggiungere test a matrice per tutti i ruoli:

| Attore | Target/azione | Risultato atteso |
|---|---|---|
| SUPER_ADMIN | altro membro | consentito secondo regole guida |
| ADMIN | SUPER_ADMIN o ADMIN | negato |
| ADMIN | CO_ADMIN o GIOCATORE | consentito |
| CO_ADMIN | cambio ruolo | negato |
| CO_ADMIN | rimozione GIOCATORE | consentito |
| GIOCATORE | amministrazione | negato |
| Qualsiasi ruolo | se stesso | autogestione negata |

## 10. Analisi per sezione dell'app

### 10.1 Login e registrazione

- aggiungere stato `isSubmitting` reale ai pulsanti;
- impedire doppi submit;
- tipizzare request, response ed errori;
- usare query parameter come Signal o subscription con cleanup;
- rimuovere `console.error` di produzione o passarli a un logger controllato;
- aggiungere autocomplete corretti (`email`, `current-password`, `new-password`, `given-name`, `family-name`);
- decidere il flusso post-registrazione come descritto in P0.7;
- aggiungere validazione password coerente con le regole backend;
- preservare un eventuale return URL sicuro dopo il login.

### 10.2 Selezione e creazione lega

- spostare `LeagueTypeOption` in un modello/configurazione di feature;
- rendere `leagueTypes` e opzioni rapide `readonly`;
- sostituire card cliccabili basate su `div` con `button` accessibili;
- applicare min/max anche come validator Angular, non soltanto attributi HTML;
- evitare assertion `nome!` e `tipoLegaId!` usando form non-nullable;
- impedire submit paralleli;
- mantenere il messaggio backend quando è sicuro e utile;
- aggiungere test per i tre tipi di lega e relativi campi condizionali.

### 10.3 Layout e navigazione

- correggere la race del cambio lega;
- sostituire `div (click)` con link o button;
- gestire Escape, focus e scroll lock del menu mobile;
- chiudere il menu anche su navigazione e resize;
- spostare la gestione tema in un `ThemeService` con accesso al DOM tramite `DOCUMENT` e controllo platform;
- gestire errore di salvataggio tema, eventualmente ripristinando il valore precedente;
- non avviare direttamente `loadMatches().subscribe()` dentro un `effect` senza cancellazione;
- aggiungere landmark `nav`, `main` e link “salta al contenuto”.

### 10.4 Homepage

- sostituire gli HTTP subscribe dentro `effect` con resource o `switchMap`;
- caricare marcatori e assist in parallelo e gestire errore/loading separatamente;
- non lasciare card vuote senza spiegazione;
- rendere le card partita accessibili da tastiera usando link/button;
- spezzare il template in componenti presentazionali: KPI, quick actions, match card, leaderboard preview;
- evitare chiamate e trasformazioni ripetute nel template;
- valutare `@defer` per leaderboard sotto la piega, con placeholder e `aria-live` appropriati.

### 10.5 Prenotazioni

- correggere UUID e contratto di cancellazione;
- nascondere o compilare solo in development il comando “Popola prenotazioni fittizie”;
- mostrare loading, empty ed error state;
- impedire prenotazioni duplicate anche visivamente, lasciando il backend come autorità;
- usare un clock aggiornabile o un valore fornito dal server per lo stato della finestra temporale;
- chiarire timezone della regola sabato/domenica;
- evitare dipendenza esclusiva dal nome completo nell'autocomplete;
- usare `track res.id` e non l'indice per righe mutabili;
- gestire anche prenotazioni senza `playerId` secondo il contratto deciso.

### 10.6 Calendario e partite

- rimuovere i mock dal servizio;
- eliminare l'anno fisso `2026` e derivare stagione/anno dai dati o da un endpoint;
- sincronizzare query parameter e caricamento partite;
- evitare `document.querySelector` e `setTimeout(200)`; usare query Angular e `afterNextRender` oppure scroll via router/fragment;
- mantenere ordinamenti come computed senza mutare l'array sorgente;
- separare lista, gruppo mensile, card e orchestrazione della pagina;
- aggiungere gestione errore e retry;
- usare DTO specifico per creazione partita, senza inviare campi non previsti;
- verificare locale e timezone nel parsing delle date.

### 10.7 Dettaglio partita e modali partita

- dividere `MatchDetailComponent` in header, score, actions, lineups e timeline;
- centralizzare le modali di conferma;
- eliminare subscribe annidati `mutation -> loadMatches` usando `switchMap`, oppure usare direttamente la risposta aggiornata del backend;
- gestire loading per singola azione e impedire doppio click;
- usare form strettamente tipizzati per goal e nuova partita;
- sostituire `array.sort(() => Math.random() - 0.5)` con Fisher-Yates per una divisione casuale corretta;
- aggiungere il comando MOTM già supportato dal backend, con controllo ADMIN/SUPER_ADMIN;
- valutare identificativi utente invece dei nomi per marcatore, assist e formazioni, così da evitare omonimie; questa modifica richiede il backend;
- migrare le animazioni legacy verso CSS `animate.enter`/`animate.leave`, poiché il package Angular animations classico è deprecato dalla 20.2.

### 10.8 Classifiche

- trasformare `activeList`, `top3` e `others` in `computed`, evitando nuove slice a ogni change detection;
- migrare `*ngIf` e `*ngFor` al control flow moderno;
- aggiungere MOTM, già disponibile nel servizio e nel backend, se previsto dalla UX;
- sincronizzare tab e URL in entrambe le direzioni;
- caricare solo i dati necessari al tab oppure mantenere una cache per stagione;
- aggiungere selezione stagione dinamica;
- gestire loading, error, empty e retry.

### 10.9 Profilo

- rimuovere stagioni fisse `2024–2026` e default `2026`;
- cancellare la richiesta precedente quando cambia stagione;
- usare `AuthorizationService` per il ruolo;
- rendere la card ultima partita accessibile da tastiera;
- mostrare loading/error delle statistiche;
- evitare di importare l'intero `MatchDetailComponent` se una card presentazionale più piccola è sufficiente.

### 10.10 Account

- tipizzare il form con `NonNullableFormBuilder`;
- usare `getRawValue()` ed eliminare possibili `undefined.trim()`;
- non ripatchare il form se l'utente ha modifiche non salvate senza una regola esplicita;
- estrarre la modale password in un dialog service o usare `NzModalService`;
- aggiungere conferma in uscita in caso di form dirty;
- normalizzare errori e loading;
- testare separatamente cambio profilo e cambio password.

### 10.11 Impostazioni lega, partecipanti e registro attività

- eliminare log `DEBUG` dal componente impostazioni;
- tipizzare `LeagueDto`, `ParticipantDto` e `ActivityLogDto`;
- usare `AuthorizationService` per tutte le decisioni;
- cambiare `getCurrentUserId(): number` in UUID nullable;
- spostare colori/etichette di ruoli e azioni in mappe tipizzate o pipe pure;
- usare loading per riga, non un unico `actionLoading` globale;
- mantenere il valore ruolo precedente finché la conferma non è accettata;
- aggiungere paginazione/virtualizzazione del registro quando i dati crescono;
- aggiungere filtri per azione, esecutore e intervallo date;
- garantire che il frontend non riutilizzi log di una lega precedente.

## 11. Modali e componenti condivisi

L'uso ripetuto di `ViewContainerRef.createComponent()` richiede in ogni pagina configurazione, subscribe, unsubscribe, destroy e gestione errori.

Modifica consigliata:

- creare un `ConfirmDialogService` che restituisce `Observable<boolean>` o `Promise<boolean>`;
- preferire `NzModalService` o Angular CDK Dialog per focus trap, Escape, aria e restore del focus;
- unificare confirm modal, password modal, add match, add goal e setup lineup su uno schema coerente;
- definire un'interfaccia comune per title, description, confirm label, danger e loading;
- impedire chiusura accidentale durante una mutazione irreversibile;
- ripristinare il focus all'elemento che ha aperto la modale.

## 12. Accessibilità

Problemi rilevati:

- numerosi `div` cliccabili senza semantica da tastiera;
- modali custom senza `role="dialog"`, `aria-modal`, focus trap e restore focus;
- `lang="en"` non coerente con contenuti italiani;
- viewport con `maximum-scale=1`, che limita lo zoom;
- azioni icon-only affidate spesso solo a `title`;
- card e menu mobile con interazione non nativa.

Modifica:

- impostare `<html lang="it">`;
- rimuovere `maximum-scale=1`;
- usare `button`, `a`, `nav`, `main`, `section`, heading in ordine logico;
- fornire nomi accessibili con testo o `aria-label`;
- garantire focus visibile e contrasto WCAG AA in light e dark mode;
- supportare tastiera ed Escape;
- usare `aria-live` per conferme, errori e contenuti caricati asincronamente;
- introdurre lint a11y e test automatici axe sulle rotte principali;
- testare almeno tastiera, VoiceOver e zoom 200%.

## 13. Stili, design system e dipendenze UI

Oggi convivono Ng-Zorro, Bootstrap, Font Awesome e molto SCSS custom. Questo aumenta CSS iniziale, specificità e uso di `!important`.

Modifica incrementale:

- definire token globali per colore, spaziatura, radius, ombre, typography e z-index;
- creare primitive condivise per page header, card, empty state, loading state, error state e modal shell;
- ridurre selettori globali che sovrascrivono internals Ng-Zorro;
- sostituire valori colore duplicati con token semantici;
- ridurre progressivamente `!important`;
- scegliere una sola libreria icone: preferibilmente Ng-Zorro icons già integrata;
- rimuovere subito il duplicato Font Awesome CDN;
- valutare la rimozione successiva di Font Awesome 4 e Bootstrap dopo aver censito le classi realmente usate;
- self-host del font Inter per eliminare dipendenza runtime da Google Fonts;
- rispettare `prefers-reduced-motion`;
- verificare responsive a 320, 375, 768, 1024 e desktop ampio.

## 14. Prestazioni

### Bundle e caricamento

- lazy load delle feature non primarie;
- analizzare il bundle dopo ogni fase;
- abbassare gradualmente i budget oggi molto permissivi (`3mb` di errore iniziale);
- rimuovere CSS e librerie duplicate;
- usare `@defer` solo per contenuti secondari pesanti e con placeholder stabile;
- ottimizzare logo e immagini, definendo width/height.

### Rendering

- `OnPush` progressivo;
- `computed` per dati derivati;
- chiavi stabili nelle liste;
- componenti più piccoli nelle pagine con template/SCSS molto grandi;
- evitare getter che allocano array a ogni controllo;
- evitare accessi diretti al DOM e timer arbitrari.

### Rete e cache

- deduplicare chiamate simultanee a stats e partite;
- cache per `leagueId + season` con invalidazione esplicita;
- cancellare richieste superate con `switchMap`/resource;
- valutare ETag/cache HTTP sugli endpoint GET insieme al backend;
- non applicare retry automatici a mutazioni non idempotenti.

Metriche da registrare prima e dopo:

- dimensione bundle iniziale e chunk per feature;
- Largest Contentful Paint;
- Interaction to Next Paint;
- Cumulative Layout Shift;
- numero di richieste all'apertura di home e al cambio lega;
- tempo di apertura calendario e amministrazione.

## 15. Error handling e feedback utente

Creare un modello unico di stato asincrono:

```ts
type LoadState = 'idle' | 'loading' | 'success' | 'empty' | 'error';
```

Modifica:

- errori di campo vicino al form;
- toast per esito di comandi;
- error state inline con retry per caricamenti pagina;
- skeleton per contenuti principali;
- messaggi 401, 403, 404, 409 e 5xx distinti;
- evitare di mostrare direttamente oggetti `err.error` non normalizzati;
- logging tecnico disabilitabile per ambiente;
- correlation/request ID mostrabile in assistenza senza esporre dettagli sensibili.

## 16. Test e qualità

### Unit test prioritari

- `AuthorizationService`: matrice completa dei ruoli;
- mapper DTO/date/status;
- `TokenStorageService` e inizializzazione sessione;
- guardie e redirect;
- cambio lega e reset store;
- regole finestra prenotazioni;
- form e validator;
- computed di partite/classifiche.

### Component test

- login: success, credenziali errate, submit doppio;
- selezione lega: tre tipi e validazioni;
- prenotazioni: aggiunta, permessi cancellazione, lista vuota;
- calendario: caricamento ritardato con `matchId` in URL;
- partecipanti: permessi e conferme;
- modali: focus, Escape, conferma e annullamento.

### E2E

Adottare Playwright o Cypress. Flussi minimi:

1. registrazione e primo accesso;
2. login con e senza “Ricordami”;
3. creazione lega e ingresso tramite codice;
4. cambio lega senza contaminazione dati;
5. prenotazione e cancellazione;
6. creazione, setup, avvio, goal e conclusione partita;
7. permessi SUPER_ADMIN/ADMIN/CO_ADMIN/GIOCATORE;
8. logout e refresh su rotta protetta;
9. smoke test dark/light e mobile.

### Tooling

Aggiungere script:

```json
{
  "lint": "ng lint",
  "typecheck": "tsc --noEmit --project tsconfig.app.json",
  "test:ci": "ng test --watch=false --browsers=ChromeHeadless",
  "build:production": "ng build --configuration production"
}
```

Integrare Angular ESLint con regole TypeScript, template e accessibilità. Aggiungere Prettier soltanto se il team decide un formato unico e lo applica senza mescolarlo ai refactor funzionali.

## 17. Pulizia del progetto

- rinominare `angular16-base` in `lineup-frontend` in package, configurazione Angular, titolo app, test e Dockerfile;
- verificare il nuovo percorso `dist` nel Dockerfile Railway;
- rimuovere proprietà, imports e commenti obsoleti;
- eliminare `FormsModule` dove si usano solo reactive forms;
- usare import relativi o alias in modo coerente, non entrambi casualmente;
- rendere `private readonly` i servizi iniettati e `protected readonly` i membri usati solo dal template;
- rimuovere il costruttore vuoto di `AuthService`;
- non committare `.angular/`, `dist/` e `.DS_Store`;
- aggiornare `frontend/README.md` con setup, script, architettura, variabili e convenzioni.

## 18. Piano incrementale di esecuzione

### Fase 0 – Baseline e rete di sicurezza (P0, taglia S)

Interventi:

- rendere eseguibili type-check, test headless e build;
- aggiungere lint;
- correggere spec obsolete;
- registrare bundle e metriche iniziali;
- documentare i flussi manuali critici.

Criterio di uscita: tutti i comandi CI passano su una copia pulita del repository.

### Fase 1 – Contratti e tipizzazione (P0/P1, taglia M)

Interventi:

- creare DTO e tipi di dominio;
- correggere tutti gli UUID;
- rimuovere `any` da auth, lega, partecipanti e log;
- separare request/response;
- introdurre mapper e test.

Criterio di uscita: nessun `any` nei flussi core e type-check verde.

### Fase 2 – Correzioni funzionali (P0, taglia M)

Interventi:

- rimuovere mock runtime;
- correggere cambio lega;
- correggere dettaglio da URL;
- correggere sottoscrizioni modale;
- decidere registrazione/sessione;
- definire cancellazione prenotazioni senza `playerId`;
- rimuovere anni/stagioni fisse.

Criterio di uscita: test automatici per ogni difetto corretto e nessuna contaminazione tra leghe.

### Fase 3 – Autorizzazioni centralizzate (P1, taglia M)

Interventi:

- introdurre `AuthorizationService`;
- migrare guardie e componenti;
- aggiungere matrice test ruoli;
- mantenere sempre il backend come autorità finale.

Criterio di uscita: nessuna regola ruolo duplicata nelle pagine.

### Fase 4 – Bootstrap e routing Angular 21 (P1/P2, taglia M)

Interventi:

- `app.config.ts`, `app.routes.ts` e `provideAppInitializer`;
- lazy loading per feature;
- rinomina progetto;
- verifica Dockerfile Railway;
- migrazione progressiva control flow.

Criterio di uscita: refresh di tutte le rotte funzionante e bundle iniziale ridotto.

### Fase 5 – Stato reattivo e gestione richieste (P1/P2, taglia L)

Interventi:

- facade/store per feature;
- resource o `switchMap` per GET reattive;
- loading/error/empty standard;
- cancellazione richieste obsolete;
- cache scoped per lega e stagione.

Criterio di uscita: nessun `subscribe()` dentro `effect` e nessuna risposta tardiva applicata alla lega sbagliata.

### Fase 6 – Componentizzazione e OnPush (P2, taglia L)

Interventi:

- spezzare homepage, dettaglio partita, layout e setup formazione;
- applicare OnPush;
- sostituire getter allocanti con computed;
- chiavi stabili nelle liste;
- rimuovere accessi diretti al DOM.

Criterio di uscita: componenti orchestratori piccoli, presentational component testabili e rendering misurato.

### Fase 7 – Dialog, design system e accessibilità (P2, taglia L)

Interventi:

- servizio dialog condiviso;
- semantica HTML e tastiera;
- focus management;
- token di design;
- consolidamento icone/CSS;
- axe test e responsive QA.

Criterio di uscita: flussi principali utilizzabili da tastiera, zoom 200% e contrasto AA.

### Fase 8 – Sicurezza sessione ed evoluzioni (P3, taglia L, richiede backend)

Interventi:

- refresh cookie HttpOnly;
- CSP completa;
- eventuali ID utente per goal/formazioni;
- ETag e caching concordati;
- monitoraggio errori e performance.

Criterio di uscita: sessione testata end-to-end e nessun segreto nella configurazione frontend.

## 19. Ordine consigliato dei primi interventi

1. Stabilizzare test e CI.
2. Creare modelli Auth/League/Participant/Reservation/ActivityLog.
3. Correggere UUID numerici.
4. Svuotare lo stato iniziale di `MatchService` e spostare i mock nei test.
5. Correggere `cambiaLega()` e il reset dati per lega.
6. Correggere dettaglio partita da query parameter.
7. Correggere le subscription della modale prenotazioni.
8. Decidere il flusso post-registrazione.
9. Centralizzare autorizzazioni.
10. Solo dopo, migrare bootstrap/routing e procedere con OnPush/componentizzazione.

Questo ordine mantiene piccoli i cambiamenti, rende ogni fase verificabile e riduce il rischio di sovrapporre una riscrittura architetturale a bug già presenti.

## 20. Definition of Done frontend

Una modifica frontend è completata quando:

- rispetta i contratti UUID e l'isolamento per lega;
- non introduce `any` non motivati;
- gestisce loading, errore e stato vuoto;
- non lascia sottoscrizioni o richieste obsolete;
- rispetta permessi e mantiene la validazione backend;
- è utilizzabile da tastiera e ha nomi accessibili;
- include test proporzionati al rischio;
- passa lint, type-check, unit test e build production;
- non aumenta il bundle senza motivazione;
- aggiorna `developer_notes.md` se cambia architettura, flussi chiave o regole condivise;
- aggiorna la configurazione Railway se cambia output, runtime config o routing Nginx.

## 21. Riferimenti ufficiali Angular

- [Angular Style Guide](https://angular.dev/style-guide)
- [Lazy-loaded routes](https://angular.dev/reference/migrations/route-lazy-loading)
- [Control flow nei template](https://angular.dev/guide/templates/control-flow)
- [Reactive data fetching con httpResource](https://angular.dev/guide/http/http-resource)
- [takeUntilDestroyed](https://angular.dev/api/core/rxjs-interop/takeUntilDestroyed)
- [Accessibilità Angular](https://angular.dev/best-practices/a11y)
- [Sicurezza Angular](https://angular.dev/best-practices/security)
- [Skipping component subtrees e OnPush](https://angular.dev/best-practices/skipping-subtrees)

Le API indicate devono essere usate nella forma disponibile nella versione Angular 21.2.x effettivamente installata nel repository; prima di adottare esempi della documentazione aggiornata a versioni successive va sempre verificata la compatibilità locale.
