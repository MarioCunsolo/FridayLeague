# Friday League - Developer Notes & Knowledge Base

Questo file contiene gli appunti di sviluppo, l'architettura del progetto FridayLeague e le regole di business da consultare ad ogni richiesta e aggiornare nel tempo.

---

## 1. Struttura del Progetto & Tecnologie

Il progetto è suddiviso in due componenti principali:
* **Backend (.NET Core)**: Situato nella cartella `beckendNET`.
  * **API Project**: [FridayLeague.Api](file:///Users/salvovitale/Desktop/Prova/FridayLeague/beckendNET/FridayLeague.Api)
  * **Database**: MySQL 8.0 avviato tramite Docker Compose ([docker-compose.yml](file:///Users/salvovitale/Desktop/Prova/FridayLeague/beckendNET/docker-compose.yml)) sulla porta `3306`.
  * **ORM**: Entity Framework Core con connessione MySQL.
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

---

## 3. Gestione della Sessione & Autenticazione (JWT)

### Ciclo di Vita del Token
* **Creazione (Login)**: Durante il login, l'utente può selezionare la spunta **"Ricordami"**.
  * Se selezionata (`remember: true`), il token viene salvato in `localStorage` per persistere alla chiusura del browser.
  * Se non selezionata (`remember: false`), il token viene salvato in `sessionStorage` (rimane attivo durante i refresh ma si cancella alla chiusura della scheda/browser).
* **Inizializzazione all'Avvio (`APP_INITIALIZER`)**:
  * All'avvio dell'app Angular, `main.ts` esegue il metodo `initSession()` di `AuthService`.
  * Questo carica asincronamente i dettagli dell'utente (`getCurrentUser()`) *prima* che l'app esegua il bootstrap ed esamini le guardie delle rotte.
  * **Importante**: Evita problemi di razza (race conditions) per cui l'utente veniva erroneamente buttato fuori o reindirizzato a `/seleziona-lega` al refresh.
* **Intercettore HTTP (`authInterceptor`)**:
  * Legge direttamente il token JWT da `localStorage` o `sessionStorage` (senza iniettare `AuthService` per evitare dipendenze circolari all'avvio) e lo appende all'header `Authorization: Bearer <token>`.
* **Logout**:
  * Il metodo `logout()` di `AuthService` distrugge il token e la configurazione della lega attiva sia in `localStorage` che in `sessionStorage`.

---

## 4. Sistema dei Ruoli e Permessi della Lega

Le autorizzazioni all'interno di una lega seguono questa gerarchia:
1. **ADMIN** (ID = 1): Proprietario/Amministratore della lega. Ha accesso completo a tutte le impostazioni. Può promuovere utenti a `CO_ADMIN`, declassarli a `GIOCATORE`, o rimuoverli definitivamente dalla lega.
2. **CO_ADMIN** (ID = 2): Co-Amministratore. Può accedere alle impostazioni e gestire i partecipanti, ma **solo quelli con ruolo `GIOCATORE`** (non può modificare o eliminare altri Co-Admin o l'Admin).
3. **GIOCATORE** (ID = 3): Giocatore semplice. Non ha alcun accesso alle sezioni di amministrazione o impostazioni di lega.

### Regole Importanti:
* Nessun utente può autogestirsi (es. l'admin non può declassarsi o eliminarsi da solo da questo flusso).
* Se un utente viene rimosso dalla sua lega attiva corrente, il suo `LegaId` nel database viene impostato a `null` in modo che debba selezionare o creare una nuova lega al successivo accesso.

---

## 5. Componenti Condivisi ed Elementi UI Notevoli

* **[ConfirmModalComponent](file:///Users/salvovitale/Desktop/Prova/FridayLeague/frontend/src/app/shared/component/confirm-modal/confirm-modal.component.ts)**:
  * Componente modale riutilizzabile per le richieste di conferma.
  * Supporta la visualizzazione adattiva per Light e Dark mode tramite le variabili CSS globali (es. `--card-bg`, `--text-primary`, `--input-bg`).
  * Supporta lo stato `isDanger` (pulsante e icona rossi pulsanti per le eliminazioni/declassamenti) o standard (blu).
  * Mostra testi personalizzabili ed emette eventi `confirm` e `cancel`.
* **Rotta `/home`**:
  * La homepage è configurata esplicitamente sul percorso `/home` in [app-routing.module.ts](file:///Users/salvovitale/Desktop/Prova/FridayLeague/frontend/src/app/app-routing.module.ts).
  * La rotta vuota `""` esegue un redirect automatico a `/home`.
  * Tutti i reindirizzamenti di navigazione (post-login, post-seleziona lega, cambio lega attiva) puntano a `/home`.

---

## 6. Linee Guida per gli Aggiornamenti Futuri

* **Controllo Preventivo**: Leggere e comprendere questo file all'inizio di ogni attività per mantenere intatta la coerenza dell'architettura e dei flussi.
* **Manutenzione del File**: Se una richiesta introduce modifiche architetturali, aggiornamenti a endpoint chiave, nuovi ruoli o nuovi componenti condivisi, questo file deve essere aggiornato tempestivamente.
