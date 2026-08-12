# LineUp — Developer Notes & Knowledge Base

Questa guida descrive lo stato effettivo del repository. Va letta prima di intervenire e aggiornata quando cambiano architettura, contratti API, regole di business o configurazione di deploy.

---

## 1. Struttura del repository e stack

Il repository contiene due applicazioni e i documenti operativi principali:

```text
FridayLeague/
├── beckendNET/
│   ├── LineUp.Api/       # API ASP.NET Core
│   ├── docker-compose.yml # MySQL 8 locale
│   └── ARCHITECTURE.md    # regole del backend a livelli
├── frontend/              # SPA Angular
├── RAILWAY_DEPLOY.md      # procedura di deploy Railway
├── FRONTEND_REFACTORING_PLAN.md
├── global.json            # SDK .NET richiesto
└── developer_notes.md     # questo file
```

- **Backend:** ASP.NET Core `net10.0`, in `beckendNET/LineUp.Api`.
- **SDK richiesto:** `global.json` richiede `10.0.100`, con `rollForward: latestFeature`. È quindi necessario avere installato un SDK .NET 10 (`dotnet --list-sdks`).
- **Database:** MySQL 8.0, avviabile con `beckendNET/docker-compose.yml`; in locale espone la porta `3306`.
- **ORM:** Pomelo `9.0.0`, che porta EF Core 9. Il progetto gira su .NET 10, ma non va aggiornato a EF Core/Pomelo 10 senza una migrazione dedicata e verificata.
- **Frontend:** Angular `21.2`, componenti standalone, Signals e control flow nativo (`@if`, `@for`), con Ng-Zorro, Bootstrap e Font Awesome locali.
- **Stile:** SCSS e variabili CSS per tema chiaro/scuro.

Gli ID di `User`, `Lega` e tutte le FK utente/lega sono UUID: `Guid` in C#, `VARCHAR(36)` in MySQL e `string` in TypeScript. Le partite e le prenotazioni mantengono invece ID numerici.

---

## 2. Avvio e configurazione locale

- **API HTTP:** `http://localhost:8080/api`
- **Swagger:** `http://localhost:8080/swagger` (oppure `https://localhost:7059/swagger` con il profilo HTTPS)
- **Frontend:** `http://localhost:4200`
- **CORS in sviluppo:** il backend accetta origini locali, inclusi dispositivi sulla stessa rete Wi-Fi.

Il frontend di sviluppo determina l'API con l'host corrente e la porta `8080`; ciò consente l'uso da un dispositivo mobile senza modificare l'URL dell'API. Se le porte `8080` o `3306` sono occupate, aggiornare coerentemente `launchSettings.json`, `appsettings.json`, `docker-compose.yml` e `frontend/src/environments/environment.development.ts`. Le eventuali personalizzazioni strettamente locali non vanno committate.

`appsettings.Development.json` contiene una chiave JWT di solo sviluppo e abilita dati demo. In produzione la chiave non è nel repository: deve essere fornita con `JwtSettings__TokenKey`.

---

## 3. Backend: bootstrap, sicurezza e persistenza

### Configurazione applicativa

`Program.cs` registra EF Core/MySQL, JWT, CORS, controller, repository, proxy e servizi di dominio. Espone inoltre `GET /health` anonimo, usato dal deploy Railway.

- La chiave `JwtSettings:TokenKey` è obbligatoria anche in locale ed è validata all'avvio.
- Per HMAC-SHA512 deve contenere **almeno 64 byte UTF-8**; chiavi più corte causano un errore esplicito invece di fallire al login.
- In produzione `Cors:AllowedOrigins` deve contenere almeno un'origine; Railway la passa tramite `Cors__AllowedOrigins__0`.
- Il token JWT è firmato HMAC-SHA512, contiene i claim dell'utente e scade dopo 7 giorni.

### Database

Non sono in uso EF Core Migrations. All'avvio l'app esegue `EnsureCreated()` e blocchi SQL fail-safe (`CREATE TABLE IF NOT EXISTS` e aggiornamenti di schema mirati) per le tabelle principali, lookup, dominio partite e prenotazioni. Quando si aggiunge un'entità o una colonna, allineare:

1. modello e mapping in `LineUpDbContext`;
2. creazione/compatibilità in `Program.cs`;
3. DTO, repository/proxy/service e client Angular interessati.

`Database:RemoveLegacyTables` e `SeedDemoData` sono impostazioni di sviluppo. Devono rimanere `false` in produzione.

### Architettura backend

Per il dominio partite, giocatori, statistiche e prenotazioni è applicato il flusso:

```text
Controller → Service → Proxy → Repository → DbContext → MySQL
```

Le regole complete sono in [ARCHITECTURE.md](beckendNET/ARCHITECTURE.md). `AuthController` è codice preesistente e accede ancora direttamente al `LineUpDbContext`: non estendere questo approccio per nuove feature; allinearlo gradualmente quando viene modificato in modo sostanziale.

---

## 4. Frontend: bootstrap, routing e stato

### Bootstrap e routing

Il frontend non usa più `AppModule` né `app-routing.module.ts`.

- `main.ts` esegue `bootstrapApplication(AppComponent, appConfig)`.
- `app.config.ts` registra router, HTTP interceptor, animazioni, locale italiano Ng-Zorro, preloading e inizializzazione della sessione.
- `app.routes.ts` contiene tutte le route standalone.
- `LayoutComponent` e `HomepageComponent` sono **eager**: costituiscono il percorso primario subito dopo login e devono restare tali per evitare un outlet vuoto durante la prima navigazione a `/home`.
- Le altre pagine di feature restano lazy-loaded.

La struttura protetta è:

```text
/login, /register                         pubbliche
/seleziona-lega                           authGuard + leagueGuard
/home, /prenotazioni, /calendario, ...    authGuard + leagueGuard, sotto LayoutComponent
/impostazioni                             anche adminOrCoAdminGuard
/impostazioni/registro-attivita           anche adminOnlyGuard
```

La rotta vuota reindirizza a `/home`; le route sconosciute reindirizzano alla radice. Dopo il login la navigazione usa `navigateByUrl('/home', { replaceUrl: true })`, così la pagina di login non resta nella cronologia. Riavviare il dev server quando si cambiano route o provider principali.

### Contratti e stato di dominio

I contratti API TypeScript sono in `frontend/src/app/models/api`:

- `core.models.ts`: UUID, ruoli, tema, tipi di lega e azioni audit.
- `auth.models.ts`: utente, leghe, autenticazione, profilo e creazione/adesione lega.
- `league.models.ts`: partecipanti e registro attività.
- `match.models.ts` e `reservation.models.ts`: DTO e richieste del dominio.

Non usare `number` per UUID. Le vecchie interfacce in `models/interface` restano come modelli di visualizzazione dove necessario; i servizi eseguono il mapping dai DTO API, incluso `string` ISO → `Date`.

`MatchService` e `ReservationService` sono la fonte di verità lato client: espongono Signals immutabili con dati e `LoadState` (`idle`, `loading`, `success`, `empty`, `error`). Non introdurre dati mock nei componenti. Al cambio della lega attiva `LegaService` svuota entrambi gli store, aggiorna l'utente e il `LayoutComponent` ricarica le partite della nuova lega.

---

## 5. Sessione e autenticazione frontend

### Ciclo di vita del token

1. Login e registrazione ricevono `AuthResponse` (`user` e `token`).
2. `AuthService` aggiorna subito il Signal `currentUser` e delega la persistenza a `TokenStorageService`.
3. Con “Ricordami” il token è in `localStorage`; altrimenti è in `sessionStorage`.
4. All'avvio `provideAppInitializer` attende `AuthService.initSession()`, che richiama `GET /api/auth/current-user` prima che le guardie valutino le route.
5. Se il ripristino fallisce, token e utente in memoria vengono rimossi per non lasciare una sessione ambigua.

`authInterceptor` aggiunge `Authorization: Bearer <token>` **solo** alle richieste il cui URL inizia con `environment.apiUrl`. Il token non può quindi essere inviato per errore a CDN o host esterni.

Il logout è effettivamente client-side: `AuthService` rimuove token e utente prima della richiesta. Tenta anche `POST /api/auth/logout` per compatibilità, ma l'API non espone al momento quell'endpoint; l'errore viene assorbito e il client torna comunque a `/login`.

### Flussi utente

- Un nuovo utente registrato è già autenticato e viene inviato a `/seleziona-lega` per creare o raggiungere una lega.
- `leagueGuard` porta un utente autenticato senza lega attiva a `/seleziona-lega`.
- Tema e lega attiva sono proprietà dell'utente restituite dall'API; il tema viene applicato dal `LayoutComponent` e sincronizzato con il backend.

---

## 6. Ruoli e autorizzazioni

La gerarchia della lega è:

1. **SUPER_ADMIN**: creatore della lega; può gestire tutti gli altri membri.
2. **ADMIN**: può gestire solo `CO_ADMIN` e `GIOCATORE`.
3. **CO_ADMIN**: può rimuovere solo `GIOCATORE`; non può modificare ruoli.
4. **GIOCATORE**: non accede alle impostazioni amministrative.

Nessuno può modificare o rimuovere se stesso. Se un membro viene rimosso dalla sua lega attiva, il backend imposta `LegaId` a `null`.

Sul frontend le regole non devono essere duplicate nei componenti: `AuthorizationService` centralizza il ruolo attivo e i permessi per impostazioni, registro attività, partecipanti, prenotazioni e partite. Le guardie proteggono le route, mentre pulsanti e azioni invocano lo stesso servizio per la visibilità/abilitazione.

Il backend resta sempre l'autorità finale: `AuthController` valida ruoli e appartenenza alla lega per cambio ruolo, rimozione partecipante e registro attività. Il registro (`/api/auth/lega/{legaId}/registri-attivita`) è visibile solo a `SUPER_ADMIN` e `ADMIN`.

---

## 7. Leghe, partite, prenotazioni e statistiche

### Leghe e audit

Una lega ha codice invito, descrizione e tipo di competizione. I tipi sono lookup in `TipiLega`:

- `PARTITA_SINGOLA` (ID 1);
- `CAMPIONATO` (ID 2, richiede almeno due squadre);
- `TORNEO` (ID 3, richiede almeno un girone).

Creazione e adesione aggiornano l'utente autenticato con la lega attiva. Il codice invito è mostrato nelle impostazioni della lega e può essere copiato tramite Clipboard API. `ActivityLog` registra creazione della lega, accesso, cambi ruolo e rimozioni.

### Partite e statistiche

Le entità principali sono `Squadra`, `Partita`, `StatoPartitaLookup`, `PartecipantePartita`, `EventoGol` e `Prenotazione`; sono tutte isolate dalla lega attiva. Lo stato partita è `Programmata`, `In Corso`, `Conclusa` o `Annullata`.

- Setup formazioni, inizio, conclusione, annullamento, eliminazione e MOTM sono riservati a `SUPER_ADMIN`/`ADMIN`. Le partite future ancora `Programmata` possono essere modificate dagli stessi ruoli tramite la modale riutilizzata della creazione: sono modificabili esclusivamente squadra casa, squadra trasferta e data/ora; punteggio e stato non sono aggiornabili da questo flusso.
- Un gol può risolvere e aggiungere automaticamente un membro della lega non ancora presente nella formazione.
- Le classifiche sono calcolate on-the-fly da gol e partecipazioni, filtrabili per stagione. Ogni classifica include tutti i membri attuali della lega attiva: chi non ha ancora gol, assist o MOTM compare con valore `0`. Il client applica il ranking competitivo `1224` (i pari merito condividono la posizione). Colori e iniziali degli avatar sono generati deterministicamente dal backend.
- Il frontend apre il dettaglio di una partita anche con `?matchId=<id>` e non usa più query del DOM o timeout per farlo.
- Il profilo usa `GET /api/players/{id}/profile/{season?}` per ottenere in una sola risposta KPI personali, confronto con la lega, ultime partite personali, andamento e stato della prossima prenotazione. Per evitare false presenze, le statistiche del profilo considerano solo partite `Conclusa`.

### Prenotazioni

Una prenotazione riguarda sempre la prossima partita `Programmata` della lega attiva; il client invia solo `nomeCognome`, non l'ID della partita né data/utente. Il server risolve i dati e restituisce anche `prenotatoDaUserId`.

- La finestra è chiusa dal sabato fino alla domenica alle 17:00; la regola è validata sia da frontend sia dal backend.
- `DELETE /api/reservations/{reservationId}` usa l'ID numerico della prenotazione, non l'UUID del giocatore.
- Il server verifica che la prenotazione appartenga alla prossima partita della lega attiva e autorizza chi è prenotato, chi ha creato la prenotazione oppure un amministratore della lega.
- `POST /api/reservations/seed-dummy` è disponibile esclusivamente in Development; in produzione restituisce 404 e la UI non espone l'azione.

---

## 8. Componenti UI condivisi

`ConfirmModalComponent` è una modale riutilizzabile, con tema adattivo, azione standard o pericolosa e output `confirm`/`cancel`. Nella gestione partecipanti viene istanziata dinamicamente con `ViewContainerRef.createComponent()`, configurata, sottoscritta e distrutta dopo l'azione.

Il layout include navigazione desktop/mobile, selettore della lega, logout e cambio tema. Componenti con richieste o sottoscrizioni di durata pagina devono usare `takeUntilDestroyed` (o un equivalente appropriato) per evitare leak.

---

## 9. Qualità del frontend

Dal percorso `frontend` sono disponibili:

```bash
npm ci
npm start
npm run typecheck
npm run lint
npm run test:ci
npm run build:production
```

ESLint è configurato in `eslint.config.js` con regole Angular e TypeScript. Parte del debito storico e delle verifiche di accessibilità è attualmente classificata come warning per consentire il refactoring incrementale; i nuovi interventi non devono aggiungere warning né aggirare i controlli.

La build di produzione usa budget iniziale di 1 MB (warning) e 3 MB (errore), output hash e output in `dist/lineup-frontend/browser`.

---

## 10. Deploy Railway

Il deploy usa tre servizi nello stesso ambiente: `mysql` privato, `api` ASP.NET Core e `frontend` Angular/Nginx. Le configurazioni Railway e Docker sono co-locate con i relativi progetti.

- **API:** Docker .NET 10, health check `/health`; richiede `ASPNETCORE_ENVIRONMENT=Production`, `ASPNETCORE_URLS=http://+:${PORT}`, connection string MySQL, impostazioni JWT e `Cors__AllowedOrigins__0`.
- **Frontend:** Docker Node 22 per build e Nginx 1.27 per servire la SPA. Nginx gestisce i refresh delle route Angular con `try_files`.
- **API runtime del frontend:** l'entrypoint genera `assets/runtime-config.js` a ogni avvio da `API_URL`. Il valore deve essere l'URL pubblico dell'API, completo di `/api`; non contiene token o segreti e non richiede una nuova build per cambiare dominio.
- **Sicurezza:** in produzione `SeedDemoData=false` e `Database__RemoveLegacyTables=false`. La JWT key non va mai committata e deve avere almeno 64 byte.

La procedura completa e le variabili Railway sono in [RAILWAY_DEPLOY.md](RAILWAY_DEPLOY.md).

---

## 11. Regole di manutenzione

1. Leggere questa guida e la documentazione di architettura pertinente prima di modificare una feature.
2. Mantenere coerenti backend, contratti TypeScript, stato client e UI quando un endpoint o DTO cambia.
3. Usare UUID come `string` in Angular e non reinserire mock nei servizi di dominio.
4. Centralizzare i nuovi permessi in `AuthorizationService`, ma replicare sempre l'autorizzazione sul backend.
5. Aggiornare questo file, `RAILWAY_DEPLOY.md` e/o `ARCHITECTURE.md` nella stessa modifica quando cambiano rispettivamente comportamento generale, deploy o convenzioni backend.
