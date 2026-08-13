# Piano di implementazione — Verifica email dei nuovi account

## 1. Obiettivo

Alla registrazione, un nuovo utente deve ricevere un'email contenente un link monouso. L'account diventa attivo solo dopo l'apertura del link e la conferma del token.

Il risultato atteso è:

1. l'utente compila il form di registrazione;
2. il backend crea un account non ancora verificato;
3. il backend invia l'email di attivazione;
4. il frontend mostra una pagina che invita a controllare la posta;
5. il link apre una pagina pubblica di LineUp;
6. il frontend invia il token all'API tramite `POST`;
7. il backend attiva l'account;
8. l'utente accede dalla pagina di login.

La conferma email non deve autenticare automaticamente l'utente. Il login esplicito conserva il significato dell'opzione “Ricordami” ed evita di creare una sessione da un link aperto su un dispositivo condiviso.

---

## 2. Stato attuale del progetto

### Backend

Oggi `POST /api/auth/register`:

- verifica che l'email non sia già presente;
- crea immediatamente il record `User`;
- genera subito un JWT valido per 7 giorni;
- restituisce `AuthResponse` con utente e token.

Oggi `POST /api/auth/login` controlla soltanto email e password. Non esiste uno stato “account in attesa di verifica”.

Il modello `User` contiene:

- `Id`;
- `Nome`;
- `Cognome`;
- `Email`;
- `PasswordHash`;
- `LegaId`;
- `Tema`.

Non sono in uso EF Core Migrations. Lo schema viene aggiornato tramite `EnsureCreated()` e SQL fail-safe in `Program.cs`. Qualunque modifica deve quindi coprire sia i database nuovi sia quelli già esistenti.

### Frontend

Oggi `AuthService.register()` tratta la risposta come autenticazione completa, salva il JWT in `localStorage` e pubblica subito `currentUser`.

Il componente di registrazione porta direttamente a `/seleziona-lega`. Non esistono pagine per:

- conferma dell'invio email;
- elaborazione del link di verifica;
- reinvio dell'email;
- gestione di link scaduti o già utilizzati.

### Punto critico aggiuntivo

`POST /api/auth/aggiorna-profilo` consente attualmente di cambiare l'email di un account autenticato senza confermare il nuovo indirizzo. Se si introduce la verifica solo in registrazione, questo endpoint permetterebbe di aggirare la proprietà “ogni email associata a un account è verificata”.

Per la prima release è quindi necessario scegliere una delle seguenti opzioni:

1. **raccomandata per il primo rilascio:** rendere temporaneamente non modificabile l'email dal profilo;
2. implementare contestualmente un flusso completo di cambio email con indirizzo in attesa e seconda verifica.

Il cambio email completo può essere una fase successiva, ma il bypass attuale non deve rimanere aperto.

---

## 3. Decisioni architetturali raccomandate

### Stato dell'account

Usare `EmailVerifiedAtUtc` nullable nel record `User`:

- `NULL`: account in attesa di attivazione;
- valorizzato: account attivo e email verificata.

Una data è preferibile a un semplice booleano perché conserva l'informazione temporale e semplifica audit e assistenza.

Non serve introdurre subito una macchina a stati completa. Se in futuro saranno necessari blocco amministrativo, cancellazione o sospensione, si potrà aggiungere un campo `Status` separato.

### Token di verifica

Il token deve essere:

- generato con un generatore crittograficamente sicuro;
- lungo almeno 32 byte casuali;
- codificato Base64 URL-safe;
- monouso;
- valido per 24 ore;
- salvato nel database esclusivamente come hash SHA-256;
- invalidato quando viene richiesto un nuovo invio;
- mai inserito in log, metriche o messaggi di errore.

Non utilizzare il JWT di autenticazione come token di verifica. I due token hanno finalità, durata e regole di revoca differenti.

### Link nell'email

Formato raccomandato:

```text
https://<frontend>/verifica-email#token=<token>
```

Il fragment `#token=...` non viene inviato automaticamente al server web o a Nginx. Angular lo legge, lo invia all'API tramite `POST` e poi sostituisce immediatamente l'URL per rimuovere il token dalla barra e dalla cronologia.

La verifica non deve avvenire con una richiesta `GET` diretta all'API: scanner e sistemi di sicurezza delle caselle email possono aprire preventivamente i link. Il `GET` deve caricare soltanto il frontend; l'attivazione effettiva avviene con il `POST` esplicito dell'app.

### Provider email

Introdurre un'astrazione interna:

```text
IEmailSender
└── ResendEmailSender      produzione
└── SmtpEmailSender        sviluppo locale tramite MailHog
```

Per il primo provider è consigliato **Resend tramite API HTTPS**, perché il backend è già configurato per dependency injection e può usare un `HttpClient` tipizzato senza dipendere da un server SMTP locale.

La scelta deve rimanere sostituibile: controller e servizio di verifica non devono conoscere Resend.

Per inviare a utenti reali sarà necessario possedere e verificare un dominio, configurando almeno SPF e DKIM. È consigliato un sottodominio dedicato, ad esempio `mail.lineup.example`, per isolare la reputazione di invio. DMARC è raccomandato per la produzione.

Riferimenti:

- [OWASP — Email Validation and Verification](https://cheatsheetseries.owasp.org/cheatsheets/Email_Validation_and_Verification_Cheat_Sheet.html)
- [ASP.NET Core rate limiting](https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit?view=aspnetcore-10.0)
- [Resend — verifica del dominio](https://resend.com/docs/dashboard/domains/introduction)
- [Resend — API](https://www.resend.com/docs/api-reference/introduction)

---

## 4. Modello dati

### Modifica a `Users`

Aggiungere:

```text
EmailVerifiedAtUtc DATETIME(6) NULL
```

Aggiornare sia `User.cs` sia il mapping EF Core.

### Nuova tabella `EmailVerificationTokens`

Struttura proposta:

| Campo | Tipo | Note |
|---|---|---|
| `Id` | `BIGINT AUTO_INCREMENT` | chiave primaria |
| `UserId` | `VARCHAR(36)` | FK verso `Users`, cancellazione cascade |
| `TokenHash` | `CHAR(64)` | SHA-256 esadecimale, indice univoco |
| `CreatedAtUtc` | `DATETIME(6)` | creazione token |
| `ExpiresAtUtc` | `DATETIME(6)` | scadenza |
| `UsedAtUtc` | `DATETIME(6) NULL` | valorizzato alla conferma |
| `RevokedAtUtc` | `DATETIME(6) NULL` | valorizzato quando un nuovo token sostituisce il precedente |
| `ProviderMessageId` | `VARCHAR(255) NULL` | identificativo tecnico del provider, mai il token |

Indici:

- `UNIQUE(TokenHash)`;
- indice su `(UserId, CreatedAtUtc)`;
- indice su `ExpiresAtUtc` per la pulizia periodica.

### Uso esclusivo di UTC

Token e verifica devono usare esclusivamente `DateTime.UtcNow`. Il codice JWT esistente usa attualmente `DateTime.Now`; questa feature non deve replicare quell'impostazione.

### Conservazione

I token usati, revocati o scaduti possono essere eliminati dopo 30 giorni. Per il primo rilascio la pulizia può essere opportunistica durante registrazione/reinvio; successivamente può diventare un `BackgroundService` pianificato.

---

## 5. Migrazione dei dati esistenti

Questo passaggio è obbligatorio per non bloccare tutti gli account già presenti.

La logica di bootstrap deve essere idempotente:

1. verificare tramite `INFORMATION_SCHEMA.COLUMNS` se `EmailVerifiedAtUtc` esiste;
2. se non esiste, aggiungerla nullable;
3. **solo nello stesso ramo in cui la colonna è appena stata aggiunta**, valorizzarla per gli utenti esistenti con `UTC_TIMESTAMP(6)`;
4. se la colonna esiste già, non eseguire alcun backfill;
5. creare `EmailVerificationTokens` con `CREATE TABLE IF NOT EXISTS`;
6. aggiornare il `CREATE TABLE Users` usato per database nuovi;
7. marcare esplicitamente come verificati gli utenti demo creati da `SeedDemoData`.

Non eseguire a ogni avvio un generico:

```sql
UPDATE Users SET EmailVerifiedAtUtc = UTC_TIMESTAMP() WHERE EmailVerifiedAtUtc IS NULL;
```

Un comando simile attiverebbe anche tutti i nuovi utenti ancora in attesa.

Prima del deploy in produzione è necessario fare un backup MySQL e provare il bootstrap su una copia dei dati.

---

## 6. Contratti API proposti

### Registrazione

```http
POST /api/auth/register
```

La richiesta non cambia:

```json
{
  "nome": "Mario",
  "cognome": "Rossi",
  "email": "mario@example.com",
  "password": "..."
}
```

Nuovo comportamento:

- normalizzare nome e cognome con `Trim()`;
- normalizzare email con `Trim().ToLowerInvariant()`;
- creare l'utente con `EmailVerifiedAtUtc = null`;
- creare e inviare il token;
- non generare JWT;
- restituire `202 Accepted`.

Risposta proposta:

```json
{
  "message": "Se l'indirizzo può essere registrato, riceverai un'email con le istruzioni per attivare l'account."
}
```

La risposta generica riduce l'enumerazione degli account. Se l'email appartiene già a un account in attesa, non si deve inviare automaticamente un numero illimitato di nuove email: il reinvio passa dall'endpoint dedicato e dal suo cooldown.

### Conferma email

```http
POST /api/auth/verify-email
```

Richiesta:

```json
{
  "token": "token-base64url"
}
```

Comportamento:

1. calcolare l'hash del token ricevuto;
2. cercare il record corrispondente;
3. verificare che non sia scaduto, usato o revocato;
4. aprire una transazione;
5. valorizzare `User.EmailVerifiedAtUtc`;
6. valorizzare `UsedAtUtc`;
7. revocare gli altri token attivi dell'utente;
8. completare la transazione.

Risposte funzionali:

- `200 OK`: verifica completata o account già verificato;
- `400 Bad Request` con codice applicativo `INVALID_OR_EXPIRED_TOKEN`: token assente, non valido o scaduto.

La risposta non deve restituire un JWT.

### Reinvio email

```http
POST /api/auth/resend-verification
```

Richiesta:

```json
{
  "email": "mario@example.com"
}
```

Risposta sempre generica:

```http
202 Accepted
```

```json
{
  "message": "Se esiste un account non ancora attivato, riceverai una nuova email."
}
```

Se l'utente è già verificato oppure non esiste, la risposta esterna resta uguale e non viene inviato un token.

### Login

Il login deve continuare a verificare prima email e password. Solo dopo una password corretta deve controllare `EmailVerifiedAtUtc`.

- credenziali errate: `401 Unauthorized`, messaggio generico attuale;
- credenziali corrette ma account non verificato: `403 Forbidden` con codice stabile `EMAIL_NOT_VERIFIED`;
- account verificato: `200 OK` con `AuthResponse` e JWT.

Il frontend deve basarsi sul codice applicativo e non confrontare stringhe italiane.

### Formato degli errori

È consigliato introdurre un DTO coerente o `ProblemDetails`:

```json
{
  "code": "EMAIL_NOT_VERIFIED",
  "message": "Devi verificare l'indirizzo email prima di accedere."
}
```

Codici minimi:

- `EMAIL_NOT_VERIFIED`;
- `INVALID_OR_EXPIRED_TOKEN`;
- `VERIFICATION_RATE_LIMITED`;
- `EMAIL_DELIVERY_UNAVAILABLE` solo per log/telemetria, non necessariamente esposto al client.

---

## 7. Architettura backend

Per non ampliare ulteriormente l'accesso diretto al `DbContext` dentro `AuthController`, introdurre componenti dedicati:

```text
AuthController
└── IAccountService
    ├── IUserRepository
    └── IEmailVerificationService
        ├── IEmailVerificationTokenRepository
        └── IEmailSender
```

Responsabilità:

### `IAccountService`

- registrazione;
- login;
- verifica dello stato account;
- coordinamento delle transazioni di account.

### `IEmailVerificationService`

- generazione token;
- hashing;
- scadenza e revoca;
- verifica atomica;
- cooldown di reinvio;
- composizione del link;
- richiesta di invio a `IEmailSender`.

### `IEmailSender`

- invio del messaggio HTML e testo;
- restituzione dell'eventuale ID del provider;
- traduzione degli errori del provider in un risultato interno;
- nessuna conoscenza di utenti o token persistiti.

### Affidabilità dell'invio

Per un primo rilascio contenuto:

1. salvare utente e token;
2. completare la transazione database;
3. tentare l'invio;
4. se il provider fallisce, mantenere l'account pending, registrare l'errore e permettere il reinvio.

Non effettuare una chiamata HTTP al provider dentro una transazione MySQL.

Per una fase successiva, introdurre un pattern outbox e un worker con retry. Questo renderebbe la consegna resiliente a riavvii tra commit e invio, ma non è indispensabile per il primo incremento se il reinvio è disponibile.

---

## 8. Email di attivazione

L'email deve avere sia versione HTML sia testo semplice.

Contenuto minimo:

- logo/nome LineUp;
- saluto con nome opportunamente codificato/escaped;
- spiegazione sintetica;
- pulsante “Attiva il tuo account”;
- URL visibile come alternativa;
- indicazione della scadenza di 24 ore;
- indicazione di ignorare il messaggio se la registrazione non è stata richiesta;
- contatto di supporto o indirizzo che possa ricevere risposte.

Oggetto suggerito:

```text
Attiva il tuo account LineUp
```

Mittente suggerito:

```text
LineUp <account@<dominio-verificato>>
```

Non inserire password, hash, dati della lega o altre informazioni personali nel messaggio.

---

## 9. Rate limiting e protezioni anti-abuso

Endpoint pubblici da proteggere:

- registrazione;
- reinvio verifica;
- conferma token;
- login, se non già protetto.

Valori iniziali proposti, da rendere configurabili:

- reinvio: minimo 60 secondi tra due email per lo stesso account;
- massimo 5 invii per account in un'ora;
- massimo 20 richieste di reinvio per IP in un'ora;
- registrazione: massimo 5 tentativi per IP in 15 minuti;
- conferma: limite per IP per contenere tentativi automatizzati.

Usare il middleware `Microsoft.AspNetCore.RateLimiting`. Per il limite per account non usare l'email in chiaro come chiave di telemetria: usare un hash normalizzato o la chiave dell'utente dopo la lookup.

Altre regole:

- messaggi coerenti per email inesistenti, già attive o pending;
- confronto dell'hash senza esporre il token;
- nessun token nei log;
- nessun invio illimitato generato ripetendo la registrazione;
- revoca dei token precedenti al reinvio;
- risposta identica quando il reinvio non produce email.

---

## 10. Modifiche frontend

### Contratti TypeScript

`AuthService.register()` non deve più aspettare `AuthResponse` né chiamare `persistAuthentication()`.

Nuovi contratti:

- `RegistrationPendingResponse`;
- `VerifyEmailRequest`;
- `ResendVerificationRequest`;
- `ApiProblem` con `code` stabile.

### Pagina “Controlla la tua email”

Nuova rotta pubblica:

```text
/verifica-email-inviata
```

Contenuto:

- conferma che la richiesta è stata ricevuta;
- istruzione di controllare posta e spam;
- link a login;
- form o azione per reinviare l'email;
- cooldown visibile prima di riabilitare il pulsante;
- messaggio generico dopo il reinvio.

Evitare di mettere l'email completa nella query string. Se serve mostrarla, usare una versione mascherata prodotta dal backend oppure mantenerla solo nello stato di navigazione, sapendo che non sopravvive al refresh.

### Pagina di verifica

Nuova rotta pubblica:

```text
/verifica-email
```

Stati UI:

- token assente;
- verifica in corso;
- verifica completata;
- token non valido/scaduto;
- errore di rete;
- nuovo invio richiesto.

Flusso:

1. leggere `token` dal fragment;
2. rimuovere subito il fragment con `replaceUrl`;
3. chiamare `POST /api/auth/verify-email` una sola volta;
4. mostrare il risultato;
5. in caso di successo offrire “Vai al login”;
6. in caso di scadenza offrire il reinvio.

### Registrazione

Dopo `202 Accepted`:

- non salvare alcun token di autenticazione;
- non valorizzare `currentUser`;
- navigare a `/verifica-email-inviata`;
- bloccare invii doppi mentre la richiesta è in corso;
- mostrare un errore solo per problemi di validazione o indisponibilità reale dell'API.

### Login

Se l'API restituisce `EMAIL_NOT_VERIFIED`:

- mostrare un messaggio dedicato;
- offrire “Invia nuovamente l'email di verifica”;
- non salvare JWT o utente;
- mantenere l'email compilata nel form.

### Route e guardie

Le due nuove route devono essere pubbliche e dichiarate accanto a `/login` e `/register`. `authGuard` e `leagueGuard` non devono essere applicate.

---

## 11. Configurazione

Configurazione proposta:

```json
{
  "App": {
    "FrontendBaseUrl": "http://localhost:4200"
  },
  "Email": {
    "Provider": "MailHog",
    "FromAddress": "no-reply@lineup.local",
    "FromName": "LineUp",
    "SmtpHost": "localhost",
    "SmtpPort": 1025
  },
  "EmailVerification": {
    "TokenLifetimeMinutes": 1440,
    "ResendCooldownSeconds": 60,
    "MaxSendsPerHour": 5
  }
}
```

Variabili Railway di produzione:

```text
App__FrontendBaseUrl=https://${{frontend.RAILWAY_PUBLIC_DOMAIN}}
Email__Provider=Resend
Email__ResendApiKey=<segreto>
Email__FromAddress=account@<dominio-verificato>
Email__FromName=LineUp
EmailVerification__TokenLifetimeMinutes=1440
EmailVerification__ResendCooldownSeconds=60
EmailVerification__MaxSendsPerHour=5
```

Regole:

- la API key non deve essere committata;
- `FrontendBaseUrl` deve essere validato come URL assoluto;
- in produzione deve usare HTTPS;
- l'app deve fallire all'avvio se provider, chiave o mittente sono mancanti/incoerenti;
- i provider MailHog e Development non devono essere utilizzabili in Production;
- non usare `API_URL` per costruire il link: serve il dominio pubblico del frontend.

### Sviluppo locale

In sviluppo locale `SmtpEmailSender` invia a MailHog (`localhost:1025`); la casella web è disponibile su `http://localhost:8025`. MailHog intercetta i messaggi senza inviarli realmente e non deve essere attivabile in produzione.

---

## 12. Logging, monitoraggio e privacy

Eventi da registrare in modo strutturato:

- account pending creato;
- invio richiesto;
- invio accettato dal provider;
- errore provider con status code e provider message ID;
- verifica completata;
- token scaduto/non valido;
- reinvio bloccato dal rate limit.

Non registrare:

- token raw;
- URL completo contenente il token;
- password;
- corpo completo dell'email;
- API key;
- email completa quando non necessaria; preferire mascheramento, user ID o hash.

Metriche utili:

- registrazioni pending;
- email inviate/fallite;
- tempo medio fra registrazione e verifica;
- verifiche riuscite/scadute;
- richieste limitate;
- account pending oltre 24/48 ore.

Prima della produzione verificare gli aspetti privacy/GDPR e il trattamento dati del provider scelto.

---

## 13. Gestione degli errori

| Scenario | Comportamento |
|---|---|
| Provider indisponibile alla registrazione | account resta pending, errore nei log, pagina invita a riprovare il reinvio |
| Email finisce nello spam | istruzioni UI e pulsante reinvio |
| Token scaduto | nessuna attivazione, pagina dedicata e reinvio |
| Token già usato | risposta idempotente se l'account è già verificato oppure messaggio generico |
| Token revocato | trattato come non valido/scaduto |
| Due conferme simultanee | transazione e update condizionale consentono una sola attivazione |
| Due registrazioni simultanee | indice univoco su `Users.Email` resta l'autorità finale |
| Riavvio dopo commit ma prima dell'invio | account pending recuperabile tramite reinvio; outbox nella fase successiva |
| Utente già attivo chiede reinvio | stessa risposta generica, nessuna email |
| Account pending tenta login | nessun JWT, errore `EMAIL_NOT_VERIFIED` |

---

## 14. Piano di test

### Backend — unit test

- token generato con lunghezza/entropia prevista;
- il database riceve solo l'hash;
- token valido entro 24 ore;
- token scaduto rifiutato;
- token usato rifiutato/idempotente;
- token revocato rifiutato;
- reinvio revoca il precedente;
- cooldown e limite orario;
- composizione del link con Base URL corretto;
- nessun JWT per account pending;
- JWT consentito dopo verifica;
- email normalizzata con trim e lowercase invariant.

### Backend — integration test

- registrazione crea utente pending e token;
- verifica aggiorna utente e token nella stessa transazione;
- login pending restituisce `EMAIL_NOT_VERIFIED`;
- login attivo restituisce `AuthResponse`;
- email duplicata sotto concorrenza non crea due utenti;
- doppia conferma simultanea non corrompe lo stato;
- reinvio per email inesistente/attiva/pending restituisce lo stesso status;
- provider finto registra il messaggio senza chiamate esterne;
- bootstrap converte correttamente un database precedente;
- utenti esistenti risultano verificati dopo l'upgrade;
- nuovi utenti pending non vengono attivati da un riavvio successivo.

### Frontend — unit/component test

- registrazione non salva token e naviga alla pagina email inviata;
- pagina verifica gestisce loading, successo, scadenza ed errore rete;
- token rimosso dall'URL;
- login mostra l'azione di reinvio solo per `EMAIL_NOT_VERIFIED`;
- pulsante reinvio rispetta il cooldown visivo;
- route pubbliche accessibili senza sessione;
- nessuna regressione sul flusso login degli utenti esistenti.

### End-to-end

1. registrare un indirizzo di test;
2. ottenere l'email dal sender di sviluppo/Mailpit;
3. aprire il link;
4. verificare la pagina di successo;
5. effettuare il login;
6. verificare il redirect a `/seleziona-lega` per un utente senza lega;
7. riprovare lo stesso link;
8. provare un link scaduto;
9. provare il reinvio e verificare che il vecchio token non funzioni.

---

## 15. Sequenza di implementazione

### Fase 1 — Modello e compatibilità database

- aggiungere `EmailVerifiedAtUtc` a `User`;
- aggiungere entità e tabella `EmailVerificationToken`;
- mapping e indici EF Core;
- SQL fail-safe e backfill una tantum;
- aggiornare seed demo;
- test del bootstrap su database nuovo e preesistente.

### Fase 2 — Servizi backend

- repository account/token;
- `IEmailVerificationService`;
- generazione e hashing token;
- sender SMTP/MailHog;
- sender Resend;
- configurazione e validazione startup;
- template HTML/testo.

### Fase 3 — Endpoint e autenticazione

- modificare `register` perché non restituisca JWT;
- aggiungere `verify-email`;
- aggiungere `resend-verification`;
- bloccare login pending;
- introdurre codici errore stabili;
- rate limiting;
- rendere temporaneamente immutabile l'email del profilo oppure implementare la verifica del cambio.

### Fase 4 — Frontend

- aggiornare DTO e `AuthService`;
- modificare il redirect della registrazione;
- pagina email inviata;
- pagina verifica;
- reinvio e cooldown;
- gestione `EMAIL_NOT_VERIFIED` nel login;
- route pubbliche;
- test responsive e accessibilità.

### Fase 5 — Deploy e verifica

- creare account provider;
- verificare dominio/sottodominio;
- configurare SPF e DKIM, poi DMARC;
- aggiungere variabili Railway;
- aggiornare `RAILWAY_DEPLOY.md` e `developer_notes.md`;
- deploy su ambiente di prova;
- test con Gmail, Outlook e almeno un provider differente;
- controllo spam e resa mobile;
- backup e deploy produzione.

### Fase 6 — Hardening successivo

- outbox e retry automatici;
- webhook bounce/complaint del provider;
- pulizia pianificata dei token;
- dashboard/alert su fallimenti;
- flusso cambio email verificato;
- eventuale cancellazione automatica degli account pending mai verificati dopo un periodo definito.

---

## 16. File che saranno probabilmente interessati

### Backend esistenti

- `beckendNET/LineUp.Api/Data/User.cs`
- `beckendNET/LineUp.Api/Data/LineUpDbContext.cs`
- `beckendNET/LineUp.Api/Controllers/AuthController.cs`
- `beckendNET/LineUp.Api/DTOs/RegisterRequest.cs`
- `beckendNET/LineUp.Api/DTOs/AuthResponse.cs`
- `beckendNET/LineUp.Api/Program.cs`
- `beckendNET/LineUp.Api/appsettings.json`
- `beckendNET/LineUp.Api/appsettings.Development.json`
- `beckendNET/docker-compose.yml`
- `beckendNET/LineUp.Api/LineUp.Api.csproj` solo se si sceglie un SDK provider anziché `HttpClient`

### Backend nuovi

- entità `EmailVerificationToken`
- DTO verifica/reinvio/risposte
- servizio account/verifica email
- repository account/token
- interfaccia e implementazioni del sender
- template email
- test backend

### Frontend esistenti

- `frontend/src/app/models/api/auth.models.ts`
- `frontend/src/app/shared/service/auth.service.ts`
- `frontend/src/app/pages/register/register.component.ts`
- `frontend/src/app/pages/register/register.component.html`
- `frontend/src/app/pages/login/login.component.ts`
- `frontend/src/app/pages/login/login.component.html`
- `frontend/src/app/app.routes.ts`

### Frontend nuovi

- pagina `verifica-email-inviata`;
- pagina `verifica-email`;
- relativi stili e test.

### Documentazione/deploy

- `developer_notes.md`
- `RAILWAY_DEPLOY.md`
- eventuale guida operativa per dominio e provider email.

---

## 17. Criteri di accettazione

La feature è completa quando:

- un nuovo account nasce non verificato;
- la registrazione non crea una sessione;
- viene inviata un'email con link HTTPS monouso;
- il token raw non è presente nel database o nei log;
- il link scade dopo 24 ore;
- un token è utilizzabile una sola volta;
- un reinvio invalida i link precedenti;
- un account pending non può ricevere JWT;
- dopo la verifica il login funziona normalmente;
- gli utenti esistenti non vengono bloccati dal deploy;
- il riavvio dell'API non attiva account pending;
- gli endpoint pubblici sono rate-limited;
- email inesistenti, attive e pending non sono distinguibili dal reinvio;
- il flusso funziona su desktop e mobile;
- il provider MailHog non può essere usato in produzione;
- configurazione e segreti Railway sono documentati;
- test automatici e prova end-to-end risultano verdi.

---

## 18. Decisioni da confermare prima dell'implementazione

1. dominio o sottodominio da usare come mittente;
2. provider definitivo (raccomandato: Resend, mantenendo `IEmailSender` astratto);
3. indirizzo mittente e indirizzo di risposta/supporto;
4. durata token, proposta 24 ore;
5. limiti di reinvio proposti;
6. comportamento dell'email modificabile dal profilo: blocco temporaneo o flusso completo;
7. durata di conservazione degli account mai verificati;
8. necessità immediata dell'outbox oppure adozione nella fase di hardening;
9. testo definitivo e branding dell'email.

Il piano raccomanda di iniziare con verifica registrazione, blocco temporaneo della modifica email, sender Resend in produzione e MailHog in locale. Il cambio email verificato e l'outbox possono seguire come incrementi separati senza compromettere la sicurezza del primo rilascio.
