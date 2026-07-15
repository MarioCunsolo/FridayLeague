# Guida all'avvio del Progetto (FridayLeague)

Questa è una breve guida per configurare e avviare correttamente il progetto sul tuo computer. 

### Prerequisiti
Assicurati di aver installato:
- **Docker** e Docker Compose
- **.NET 8 SDK** (o la versione supportata dal progetto)
- **Node.js** e NPM

---

### 1. Avviare il Database (tramite Docker)
Il progetto utilizza MySQL e la sua configurazione si trova nella cartella del backend.
1. Apri il terminale.
2. Naviga nella cartella `beckendNET`:
   ```bash
   cd percorso/del/progetto/FridayLeague/beckendNET
   ```
3. Avvia il container Docker in background:
   ```bash
   docker-compose up -d
   ```
*Nota: questo avvierà un'istanza di MySQL sulla porta `3306` con il database `lineup` e le credenziali preimpostate.*

---

### 2. Avviare il Backend (.NET Core)
Ora che il database è in esecuzione, puoi lanciare le API.
1. Dal terminale, spostati nella cartella del progetto API (sempre all'interno di `beckendNET`):
   ```bash
   cd LineUp.Api
   ```
2. Ripristina i pacchetti NuGet (necessario principalmente al primo avvio):
   ```bash
   dotnet restore
   ```
3. *(Opzionale ma consigliato per il primo avvio)* Aggiorna il database applicando le migrazioni di Entity Framework:
   ```bash
   dotnet ef database update
   ```
4. Avvia il server backend:
   ```bash
   dotnet run
   ```
*Il backend sarà ora in ascolto e le API risponderanno su `http://localhost:8080/api`.*

---

### 3. Avviare il Frontend (Angular)
Infine, avvia l'interfaccia utente.
1. Apri una **nuova finestra** del terminale (lasciando il backend in esecuzione nell'altra).
2. Spostati nella cartella `frontend`:
   ```bash
   cd percorso/del/progetto/FridayLeague/frontend
   ```
3. Installa tutte le dipendenze di Node (solo al primo avvio o se ci sono cambiamenti):
   ```bash
   npm install
   ```
4. Avvia il server di sviluppo di Angular:
   ```bash
   npm start
   ```
*Il frontend sarà accessibile aprendo il browser all'indirizzo `http://localhost:4200`.*
