# Deploy su Railway

Il repository è predisposto per tre servizi Railway nello stesso ambiente: `mysql`, `api` e `frontend`.

## 1. MySQL

1. Crea un progetto Railway.
2. Aggiungi il database MySQL e rinomina il servizio in `mysql`.
3. Mantienilo privato: l'API usa le variabili interne del database, senza TCP proxy pubblico.
4. Configura i backup prima di usare dati reali.

## 2. Frontend

1. Aggiungi il repository GitHub come nuovo servizio e rinominalo `frontend`.
2. In **Settings > Build**, imposta la Root Directory su `frontend`.
3. Esegui il deploy con una variabile provvisoria:

   ```text
   API_URL=https://example.invalid/api
   ```

4. In **Settings > Networking**, genera il dominio pubblico del frontend.

Il container Angular usa Nginx, gestisce i refresh sulle rotte Angular e legge `API_URL` a ogni avvio da `assets/runtime-config.js`; non richiede una nuova build per cambiare l'URL dell'API.

## 3. API

1. Aggiungi di nuovo lo stesso repository come servizio e rinominalo `api`.
2. In **Settings > Build**, imposta la Root Directory su `beckendNET/LineUp.Api`.
3. Imposta queste variabili:

   ```text
   ASPNETCORE_ENVIRONMENT=Production
   ASPNETCORE_URLS=http://+:${PORT}
   ConnectionStrings__DefaultConnection=Server=${{mysql.MYSQLHOST}};Port=${{mysql.MYSQLPORT}};Database=${{mysql.MYSQLDATABASE}};User ID=${{mysql.MYSQLUSER}};Password=${{mysql.MYSQLPASSWORD}};SslMode=Preferred;
   JwtSettings__TokenKey=<segreto-casuale-lungo>
   JwtSettings__Issuer=LineUpBackend
   JwtSettings__Audience=LineUpFrontend
   Cors__AllowedOrigins__0=https://${{frontend.RAILWAY_PUBLIC_DOMAIN}}
   SeedDemoData=false
   Database__RemoveLegacyTables=false
   ```

4. Genera il dominio pubblico dell'API. Railway esegue il controllo salute su `/health` come definito in `railway.toml`.

Genera `JwtSettings__TokenKey` localmente con (la chiave HMAC-SHA512 deve avere almeno 64 byte):

```bash
openssl rand -base64 48
```

## 4. Collegamento finale del frontend

Nel servizio `frontend`, sostituisci la variabile provvisoria con:

```text
API_URL=https://${{api.RAILWAY_PUBLIC_DOMAIN}}/api
```

Railway riavvierà Nginx e l'app Angular inizierà a usare l'API senza ricompilazione. Il riferimento dinamico evita URL hard-coded e segue eventuali cambi di dominio Railway.

## 5. Verifica

1. Apri il dominio del frontend e registra un nuovo utente.
2. Controlla i log del servizio `api` e la risposta `GET /health`.
3. Riavvia l'API e verifica che MySQL conservi i dati.
4. Non abilitare `SeedDemoData` né `Database__RemoveLegacyTables` in produzione.

## Sviluppo locale

In ambiente Development rimangono attivi i dati demo, la chiave JWT locale e il CORS permissivo per supportare il frontend locale e i test su rete Wi-Fi. Queste impostazioni non vengono applicate con `ASPNETCORE_ENVIRONMENT=Production`.
