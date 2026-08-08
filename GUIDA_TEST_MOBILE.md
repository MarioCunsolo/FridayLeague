# 📱 Guida per Testare l'Applicazione su Dispositivo Mobile (Wi-Fi Locale)

Questa guida spiega come testare la web app **FridayLeague** (Frontend Angular + Backend .NET 8) direttamente sul tuo smartphone (iOS / Android) collegato alla stessa rete Wi-Fi del tuo computer (**macOS** o **Windows**).

---

## 📌 Prerequisiti
1. Il tuo **Computer (macOS / Windows)** e il tuo **Smartphone** devono essere connessi alla **stessa rete Wi-Fi**.

---

## 🚀 Passo 1: Individuare l'Indirizzo IP Locale del Computer

### 🍎 Su macOS:
Apri il **Terminale** ed esegui:
```bash
ipconfig getifaddr en0
```
*(Se non ottieni alcun risultato, riprova con `en1`).*

### 🪟 Su Windows:
1. Apri il **Prompt dei Comandi (cmd)** o **PowerShell**.
2. Esegui il comando:
   ```cmd
   ipconfig
   ```
3. Cerca la sezione **Scheda LAN wireless Wi-Fi** (o *Wireless LAN adapter Wi-Fi*) e individua la voce **Indirizzo IPv4** (es. `192.168.1.15`).

👉 **Prendi nota del tuo IP locale**, che sarà del tipo: `192.168.1.X`.

---

## 💻 Passo 2: Avviare il Frontend (Angular) per la Rete Locale

Di default Angular risponde solo su `localhost`. Per abilitare le connessioni dal cellulare sulla rete locale, avvialo specificando l'opzione `--host 0.0.0.0`:

1. Apri il Terminale/Prompt dei Comandi ed entra nella cartella `frontend`:
   ```bash
   cd frontend
   ```
2. Avvia il server di sviluppo Angular:
   ```bash
   npx ng serve --host 0.0.0.0
   ```

---

## ⚙️ Passo 3: Configurare ed Avviare il Backend (.NET 8)

Per fare in modo che l'app sul telefono comunichi con l'API sul computer:

1. Se l'API richiede un cambio IP nelle chiamate del frontend, sostituisci `localhost` con il tuo IP locale (es. `http://192.168.1.15:5000`) nel file di configurazione dell'ambiente.
2. Apri il Terminale/Prompt ed entra nella cartella del backend:
   ```bash
   cd beckendNET/LineUp.Api
   ```
3. Avvia il server .NET specificando la porta impostata dal dev, ad esempio la porta usata dal dev `5050` (*la porta 5000 su macOS è occupata di default da AirPlay/ControlCenter*):
   ```bash
   dotnet run --urls "http://0.0.0.0:5050"
   ```

---

## 📲 Passo 4: Aprire l'Applicazione sullo Smartphone

1. Apri **Safari** (iOS) o **Chrome** (Android) sul tuo telefono.
2. Digita nella barra degli indirizzi il seguente URL (sostituendo l'IP di esempio con il tuo IP reale del Passo 1):

```text
http://[indirizzo_ip_ricavato_all'inizio]:4200
```

---

## 🛠️ Risoluzione Problemi Frequenti

- **La pagina non si carica sul cellulare**:
  - Assicurati che il cellulare NON sia connesso alla rete dati (4G/5G) ma alla stessa linea Wi-Fi del computer.
  - **Su Windows**: Se appare una finestra di *Windows Defender Firewall*, seleziona la spunta su **Reti private** e clicca **Consenti accesso**.
  - **Su macOS**: Verifica nelle *Impostazioni di Sistema -> Rete -> Firewall* che le connessioni in ingresso non siano bloccate per Node/dotnet.

- **L'app si carica ma i dati non vengono visualizzati (Errore API)**:
  - Assicurati che l'API backend sia stata avviata con `--urls "http://0.0.0.0:5000"` e che le chiamate HTTP del frontend puntino all'IP locale del computer invece che a `localhost`.
