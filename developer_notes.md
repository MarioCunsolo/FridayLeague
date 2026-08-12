# LineUp - Developer Notes & Knowledge Base

Questo file contiene gli appunti di sviluppo, l'architettura del progetto LineUp e le regole di business da consultare ad ogni richiesta e aggiornare nel tempo.

---

## 1. Struttura del Progetto & Tecnologie

Il progetto è suddiviso in due componenti principali:
* **Backend (ASP.NET Core su .NET 10)**: Situato nella cartella `beckendNET`.
  * **API Project**: [LineUp.Api](file:///Users/salvovitale/Desktop/Prova/LineUp/beckendNET/LineUp.Api)
  * **Database**: MySQL 8.0 avviato tramite Docker Compose ([docker-compose.yml](file:///Users/salvovitale/Desktop/Prova/LineUp/beckendNET/docker-compose.yml)) sulla porta `3306`.
* **ORM & Data Types**: Entity Framework Core 9 con il provider MySQL Pomelo 9, in esecuzione su .NET 10. Pomelo non dispone ancora di una release stabile per EF Core 10: non aggiornare EF Core a 10 né sostituire il provider senza una migrazione dedicata e verificata. Le entità **User** e **Lega** (e tutte le chiavi esterne correlate `UserId`, `LegaId`, `EsecutoreId`, `TargetUserId`, `PrenotatoDaUserId`) utilizzano **UUID** (`Guid` in C#, `VARCHAR(36)` in MySQL, `string` in TypeScript) per garantire identificatori univoci e sicurezza dei riferimenti.
* **Frontend (Angular)**: Situato nella cartella `frontend`.
  * **Framework**: Angular 21 (standalone components, control flow syntax `@if`, `@for`, ecc.).
  * **UI Library**: Ng-Zorro-Antd (Ant Design per Angular).
  * **Styling**: CSS custom per Light e Dark mode.

---

## 2. Configurazione Porte e URL

* **Backend API URL**: `http://localhost:8080/api` (in sviluppo locale).
* **Documentazione API (Swagger)**:
  * **HTTP**: `http://localhost:8080/swagger`
  * **HTTPS**: `https://localhost:7059/swagger`
* **Frontend Default URL**: `http://localhost:4200` (CORS configurato per questa origine sul BE).
* **Nota su conflitti di porta locali**: se sulla propria macchina le porte `8080` o `3306` risultano già occupate (es. da un antivirus o da un'installazione MySQL di sistema), è sufficiente cambiare le porte solo in locale in `launchSettings.json`, `appsettings.json` e `docker-compose.yml` (aggiornando anche `environment.development.ts` nel frontend) e marcare questi file con `git update-index --skip-worktree` per evitare di propagare la modifica agli altri sviluppatori (`--no-skip-worktree` per annullare).

---

## 3. Gestione della Sessione & Autenticazione (JWT)

### Ciclo di Vita del Token
* **Creazione (Login)**: Durante il login, l'utente può selezionare la spunta **"Ricordami"**.
  * Se selezionata (`remember: true`), il token viene salvato in `localStorage` per persistere alla chiusura del browser.
  * Se non selezionata (`remember: false`), il token viene salvato in `sessionStorage` (rimane attivo durante i refresh ma si cancella alla chiusura della scheda/browser).
* **Inizializzazione all'Avvio (`provideAppInitializer`)**:
  * All'avvio dell'app Angular, `app.config.ts` esegue il metodo `initSession()` di `AuthService` tramite `provideAppInitializer`.
  * Questo carica asincronamente i dettagli dell'utente (`getCurrentUser()`) *prima* che l'app esegua il bootstrap ed esamini le guardie delle rotte.
  * **Importante**: Evita problemi di razza (race conditions) per cui l'utente veniva erroneamente buttato fuori o reindirizzato a `/seleziona-lega` al refresh.
* **Intercettore HTTP (`authInterceptor`)**:
  * Legge il token da `TokenStorageService`/storage e lo appende all'header `Authorization: Bearer <token>` solo alle richieste dirette verso `environment.apiUrl`, evitando di inviarlo a CDN o host esterni.
* **Logout**:
  * Il metodo `logout()` di `AuthService` distrugge il token e la configurazione della lega attiva sia in `localStorage` che in `sessionStorage`.

---

## 4. Sistema dei Ruoli e Permessi della Lega

Le autorizzazioni all'interno di una lega seguono questa gerarchia:
1. **SUPER_ADMIN** (ID = 4): Il creatore della lega. Ha accesso a tutte le impostazioni. Ha pieni poteri per modificare i ruoli di chiunque (promuovere/declassare ad `ADMIN`, `CO_ADMIN`, `GIOCATORE`) e per rimuovere qualsiasi partecipante (eccetto se stesso).
2. **ADMIN** (ID = 1): Amministratore delegato. Ha accesso alle impostazioni. Può modificare i ruoli di Co-Admin e Giocatori (assegnando loro `ADMIN`, `CO_ADMIN` o `GIOCATORE`), ma **non può gestire il Super Admin o altri Admin**. Può anche rimuovere membri Co-Admin o Giocatori (ma non Super Admin o altri Admin).
3. **CO_ADMIN** (ID = 2): Co-Amministratore. Può accedere alla sezione impostazioni di lega, ma nella gestione dei partecipanti **non ha i permessi per modificare i ruoli (non può promuovere/declassare nessuno)**. Può invece rimuovere i membri della lega, ma **solo ed esclusivamente se hanno il ruolo di `GIOCATORE`** (non può rimuovere Super Admin, Admin o altri Co-Admin).
4. **GIOCATORE** (ID = 3): Giocatore semplice. Non ha alcun accesso alle sezioni di amministrazione o impostazioni di lega.

### Regole Importanti:
* Nessun utente può autogestirsi (es. non può modificare o eliminare se stesso).
* Se un utente viene rimosso dalla sua lega attiva corrente, il suo `LegaId` nel database viene impostato a `null` in modo che debba selezionare o creare una nuova lega al successivo accesso.
* **Sicurezza FE (Route Guard)**: La rotta `/impostazioni` (e i suoi figli) è protetta da **`adminOrCoAdminGuard`** ([admin-or-co-admin.guard.ts](file:///Users/salvovitale/Desktop/Prova/LineUp/frontend/src/app/shared/guard/admin-or-co-admin.guard.ts)), impedendo l'accesso diretto via URL a utenti con ruolo semplice `GIOCATORE` (la guardia autorizza `SUPER_ADMIN`, `ADMIN` e `CO_ADMIN`).
* **Sicurezza FE (Component Controller)**: All'interno di `GestisciPartecipantiComponent`, i metodi `eseguiCambioRuolo` e `rimuoviPartecipante` effettuano un ulteriore controllo di sicurezza preventivo sul ruolo dell'utente corrente (`getCurrentUserRole()`), bloccando la chiamata e mostrando un messaggio di errore se l'utente non è autorizzato (rispettivamente `SUPER_ADMIN`/`ADMIN` per il ruolo, e `SUPER_ADMIN`/`ADMIN`/`CO_ADMIN` per l'eliminazione).
* **Sicurezza BE (API Controller)**: I controlli sui ruoli per le azioni amministrative (`cambia-ruolo-partecipante` e `rimuovi-partecipante`) sono validati a livello di controller in `AuthController.cs`.
  * `cambia-ruolo-partecipante` permette l'esecuzione a utenti `SUPER_ADMIN` e `ADMIN` (gli `ADMIN` non possono agire su `SUPER_ADMIN` o altri `ADMIN`).
  * `rimuovi-partecipante` permette l'esecuzione a utenti `SUPER_ADMIN` (su chiunque), `ADMIN` (solo su `CO_ADMIN` e `GIOCATORE`), e `CO_ADMIN` (solo su target con ruolo `GIOCATORE`).

---

## 5. Componenti Condivisi ed Elementi UI Notevoli

* **[ConfirmModalComponent](file:///Users/salvovitale/Desktop/Prova/LineUp/frontend/src/app/shared/component/confirm-modal/confirm-modal.component.ts)**:
  * Componente modale riutilizzabile per le richieste di conferma.
  * Supporta la visualizzazione adattiva per Light e Dark mode tramite le variabili CSS globali (es. `--card-bg`, `--text-primary`, `--input-bg`).
  * Supporta lo stato `isDanger` (pulsante e icona rossi pulsanti per le eliminazioni/declassamenti) o standard (blu).
  * Mostra testi personalizzabili ed emette eventi `confirm` e `cancel`.
  * **Invocazione Programmatica (TS)**: La modale non è configurata nel template HTML dei singoli componenti. Viene caricata in memoria dinamicamente da codice TypeScript (es. tramite `ViewContainerRef.createComponent()`), configurata con i parametri desiderati (`title`, `message`, `confirmText`, `isDanger`), sottoscritta agli eventi di output (confirm/cancel) e infine distrutta esplicitamente (`componentRef.destroy()`) una volta terminata l'azione, ottimizzando il DOM ed evitando di sporcare i template HTML.
* **Rotta `/home`**:
  * La homepage è configurata esplicitamente sul percorso `/home` in [app-routing.module.ts](file:///Users/salvovitale/Desktop/Prova/LineUp/frontend/src/app/app-routing.module.ts).
  * La rotta vuota `""` esegue un redirect automatico a `/home`.
  * Tutti i reindirizzamenti di navigazione (post-login, post-seleziona lega, cambio lega attiva) puntano a `/home`.
* **Codice Invito della Lega**:
  * Esposto dal backend arricchendo `LegaDto` con i campi `CodiceInvito` e `Descrizione` in [UserDto.cs](file:///Users/salvovitale/Desktop/Prova/LineUp/beckendNET/LineUp.Api/DTOs/UserDto.cs).
  * Mostrato nella dashboard di **[ImpostazioniLegaComponent](file:///Users/salvovitale/Desktop/Prova/LineUp/frontend/src/app/pages/impostazioni-lega/impostazioni-lega.component.ts)** tramite un banner informativo premium (`.league-info-banner`).
  * Include la funzionalità "Copia Codice" con riscontro visivo tramite toast message di successo (`NzMessageService`) sfruttando le Clipboard API del browser (`navigator.clipboard`).

---

## 6. Registro Attività (Audit Logging)

Il sistema di tracciamento e log di audit memorizza le azioni amministrative in modo indipendente per ciascuna lega:
* **Entità nel Database (`ActivityLog`)**: [ActivityLog.cs](file:///Users/salvovitale/Desktop/Prova/LineUp/beckendNET/LineUp.Api/Data/ActivityLog.cs)
  * Campi: `Id`, `LegaId`, `EsecutoreId`, `EsecutoreNome`, `EsecutoreRuolo`, `Azione` (`CREAZIONE_LEGA`, `ACCESSO_LEGA`, `CAMBIO_RUOLO`, `RIMOZIONE_UTENTE`), `TargetUserId`, `TargetUserNome`, `Dettagli`, `Timestamp`.
* **Tenant Isolation & Sicurezza (Separazione Log)**:
  * L'endpoint `GET /api/auth/lega/{legaId}/registri-attivita` è filtrato rigorosamente su `LegaId == legaId`.
  * Il backend convalida che l'utente appartenga alla lega `{legaId}` richiesta e abbia ruolo amministrativo di **`SUPER_ADMIN` o `ADMIN`** (escludendo quindi i Co-Admin). Altri ruoli ricevono `403 Forbidden`.
* **Visualizzazione (FE)**:
  * Pagina ad accesso riservato: **[RegistroAttivitaComponent](file:///Users/salvovitale/Desktop/Prova/LineUp/frontend/src/app/pages/impostazioni-lega/registro-attivita/registro-attivita.component.ts)**.
  * Navigabile da `/impostazioni/registro-attivita`, protetta da **`adminOnlyGuard`** (che concede l'accesso solo a `SUPER_ADMIN` e `ADMIN`).
  * La card di navigazione in `ImpostazioniLegaComponent` è nascosta per i `CO_ADMIN` tramite direttiva `@if (isAdminOrSuperAdmin())`.
  * Tabella con badge per identificare i ruoli ed i tipi di azione con colori standardizzati coerenti sia in tema dark che light.

---

## 7. Dominio Partite, Giocatori, Prenotazioni e Classifiche

Introdotto seguendo il Repository Pattern descritto in [ARCHITECTURE.md](beckendNET/ARCHITECTURE.md). Tutte le entità sono scoped per Lega.

* **Entità (`Data/`)**: `Squadra` (nome squadra per lega, creata automaticamente al primo utilizzo), `Partita` (Stato gestito tramite tabella di lookup `StatiPartita` e `StatoId`: `Programmata`, `In Corso`, `Conclusa`, `Annullata`, punteggio, stagione), `StatoPartitaLookup` (`StatiPartita`), `PartecipantePartita` (formazione di una partita + flag MOTM), `EventoGol` (marcatore/assist per partita), `Prenotazione` (per la prossima partita programmata della lega).
* **Giocatori**: non esiste un'anagrafica separata — un "giocatore" è semplicemente uno `User` iscritto alla Lega (tabella `UserLeghe`).
* **Imposta Partita & Gestione Formazioni**: la funzionalità di impostazione formazioni da prenotazioni (`POST /api/matches/{id}/setup-lineup`), l'avvio partita (`PUT /api/matches/{id}/inizia`), la conclusione anticipata (`PUT /api/matches/{id}/concludi`), l'eliminazione ed l'annullamento della partita nella schermata di dettaglio sono **riservati esclusivamente ai ruoli `SUPER_ADMIN` e `ADMIN`** (`isAdminOrSuperAdmin()`).
* **Avvio Partita & Registrazione Goal**: cliccando su **"Inizia Partita"**, lo stato passa da `Programmata` a `In Corso`. Quando la partita è `In Corso`, compaiono i pulsanti per aggiungere i goal (`POST /api/matches/{id}/goals`) ed il pulsante **"Concludi Partita"** (`PUT /api/matches/{id}/concludi`) per terminarla anticipatamente prima del timeout di 2 ore.
* **Risoluzione automatica dei partecipanti**: quando viene registrato un gol (`POST /api/matches/{id}/goals`) con un nome che non è ancora nella formazione della partita, il sistema cerca un membro della lega con quel nome e lo aggiunge automaticamente come partecipante (lato marcatore/assist).
* **Prenotazioni**: sempre riferite alla prossima partita con Stato `Programmata` della lega attiva (risolta lato server, il client non specifica l'ID partita). Finestra di prenotazione (sabato intero + domenica fino alle 17:00) validata sia FE (`isReservationDisabled`) che BE (`ReservationService.ValidaFinestraPrenotazione`). La cancellazione usa l'ID numerico della prenotazione (`DELETE /api/reservations/{reservationId}`), con verifica lato server che la prenotazione appartenga alla partita programmata della lega attiva: ciò supporta anche prenotazioni con nome libero e senza `UserId`.
* **MOTM**: un solo Man of the Match per partita (`PUT /api/matches/{id}/motm`, riservato ad ADMIN/SUPER_ADMIN). Endpoint predisposto ma non ancora collegato a un pulsante nel frontend.
* **Classifiche/Statistiche**: calcolate on-the-fly (nessuna tabella aggregata) da `EventoGol`/`PartecipantePartita`, filtrabili per stagione. Colore e iniziali avatar sono generati deterministicamente lato BE (`PlayerDisplayExtensions`), non persistiti.
* **Nota migrazione DB**: non essendo in uso EF Core Migrations, le nuove tabelle vengono create in `Program.cs` con `CREATE TABLE IF NOT EXISTS` (stesso pattern già usato per `ActivityLogs`). Se si aggiungono nuove entità, aggiornare sia `OnModelCreating` che questo blocco fail-safe.

---

## 8. Cambio Password

Il flusso di cambio password (`account.component.ts` → `apriModificaPassword()`) usa l'endpoint dedicato `POST /auth/cambia-password` (`AuthService.cambiaPassword`). Non riutilizzare `aggiorna-profilo` per la password: il DTO `AggiornaProfiloRequest` ha un campo `Password` legacy che il backend ignora silenziosamente.

---

## 10. Tipologie di Lega e Formati di Competizione

Il sistema supporta 3 tipologie di competizione per le leghe, memorizzate tramite la tabella di lookup `TipiLega` e le colonne di configurazione in `Leghe`:

* **Entità Lookup (`TipoLegaLookup`)**: [TipoLegaLookup.cs](file:///Users/salvovitale/Desktop/Prova/FridayLeague/beckendNET/LineUp.Api/Data/TipoLegaLookup.cs)
  * `1` - `PARTITA_SINGOLA`: "Partita Singola". Lega classica basata sulla prenotazione individuale dei giocatori e formazione di 2 squadre per match.
  * `2` - `CAMPIONATO`: "Campionato". Campionato a girone unico a scontri diretti con numero di squadre stabilito alla creazione (`NumeroSquadre`).
  * `3` - `TORNEO`: "Torneo". Torneo a gironi con numero di gironi stabilito alla creazione (`NumeroGironi`) con successiva fase finale ad eliminazione diretta.
* **Proprietà in `Lega`**:
  * `TipoLegaId` (`int`, FK a `TipiLega`, default `1`).
  * `NumeroSquadre` (`int?`, obbligatorio solo per Campionato).
  * `NumeroGironi` (`int?`, obbligatorio solo per Torneo).
* **Creazione Lega (FE/BE)**:
  * Durante la creazione in `SelezionaLegaComponent`, l'utente visualizza le card interattive con le descrizioni per ciascun formato di competizione.
  * I parametri `NumeroSquadre` e `NumeroGironi` compaiono in modo dinamico e sono validati sia lato frontend che nel controller .NET (`CreaLega`).

---

## 9. Linee Guida per gli Aggiornamenti Futuri

* **Controllo Preventivo**: Leggere e comprendere questo file all'inizio di ogni attività per mantenere intatta la coerenza dell'architettura e dei flussi.
* **Manutenzione del File**: Se una richiesta introduce modifiche architetturali, aggiornamenti a endpoint chiave, nuovi ruoli o nuovi componenti condivisi, questo file deve essere aggiornato tempestivamente.
* **SDK .NET**: il repository richiede .NET SDK 10. Il file `global.json` richiede la feature band `10.0.100` e consente l'avanzamento automatico all'ultima feature band stabile di .NET 10 installata.
* **Frontend moderno**: il bootstrap usa `app.config.ts`, `provideAppInitializer` e `app.routes.ts`. Le pagine standalone sono lazy-loaded e i contratti API sono in `frontend/src/app/models/api`; UUID sono sempre `string`. I permessi frontend sono centralizzati in `AuthorizationService`, mentre la validazione backend rimane l'autorità finale.

---

## 11. Deploy Railway

Il deploy Railway usa tre servizi nello stesso ambiente: `mysql` (privato), `api` (ASP.NET Core) e `frontend` (Angular/Nginx). Le configurazioni dei singoli servizi sono co-locate con il codice (`Dockerfile`, `railway.toml` e `.dockerignore`).

* **API**: richiede le variabili `ASPNETCORE_ENVIRONMENT=Production`, `ASPNETCORE_URLS=http://+:${PORT}`, `ConnectionStrings__DefaultConnection`, `JwtSettings__TokenKey` e `Cors__AllowedOrigins__0`. Espone `GET /health` per Railway.
* **Database**: la connection string usa le variabili referenziate del servizio `mysql` (`MYSQLHOST`, `MYSQLPORT`, `MYSQLDATABASE`, `MYSQLUSER`, `MYSQLPASSWORD`), senza esporre il database pubblicamente.
* **Frontend**: legge `API_URL` al runtime da `assets/runtime-config.js`, generato dall'entrypoint Nginx. Il valore deve essere l'URL pubblico dell'API, completo di `/api`.
* **Sicurezza produzione**: `SeedDemoData` e `Database__RemoveLegacyTables` devono rimanere `false`; in produzione il CORS viene avviato solo con un'origine esplicita e non è presente alcuna chiave JWT nel repository.

La procedura operativa completa e le variabili da inserire sono documentate in [RAILWAY_DEPLOY.md](RAILWAY_DEPLOY.md).
