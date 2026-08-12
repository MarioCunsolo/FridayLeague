# LineUp frontend

Frontend Angular 21 dell'applicazione LineUp. Usa componenti standalone, Signals, Ng-Zorro e una configurazione runtime dell'API per Railway.

## Requisiti

- Node.js 22 o superiore
- npm
- Backend API in esecuzione su `http://localhost:8080` in locale

## Avvio locale

```bash
npm ci
npm start
```

L'app è disponibile su `http://localhost:4200`. In sviluppo l'API è costruita automaticamente con l'host corrente e porta `8080`.

## Comandi di qualità

```bash
npm run typecheck
npm run test:ci
npm run build:production
```

## Architettura

- `src/app/app.config.ts`: provider applicativi, inizializzazione sessione e router.
- `src/app/app.routes.ts`: rotte standalone lazy-loaded.
- `src/app/models/api`: contratti TypeScript che rispecchiano i DTO .NET.
- `src/app/shared/service`: servizi API, sessione, autorizzazioni e stato di dominio.
- `src/app/pages`: feature e pagine dell'interfaccia.

Gli identificativi di utenti e leghe sono UUID, quindi `string` in TypeScript. Ogni dato di dominio è associato alla lega attiva.

## Railway

In produzione Nginx genera `assets/runtime-config.js` usando `API_URL`. Il valore deve essere l'URL pubblico dell'API completo di `/api`; non inserire segreti o token JWT in questa variabile.
