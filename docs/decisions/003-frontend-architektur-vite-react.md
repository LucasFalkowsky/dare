# ADR-003: Frontend-Architektur — Vite + React + TypeScript

**Status:** Accepted
**Datum:** 2026-06-08

## Kontext

DARE benötigt ein Web-Frontend für die Verwaltung von Principles und die Visualisierung des Dashboards. Das Backend (Express, hexagonale Architektur, PostgreSQL/Prisma) ist bereits produktionsreif. Das Frontend soll:

- Schnelle Entwicklungszyklen mit Hot Module Replacement (HMR) ermöglichen
- TypeScript für Typ-Sicherheit nutzen
- Im selben Repository wie das Backend leben
- Für neue Entwickler:innen leicht verständlich sein (eine `package.json`, minimale Config)

## Entscheidung

### Build-Tool: Vite

Vite wird als Build-Tool und Dev-Server eingesetzt:

- Native ES-Module im Development (kein Bundling während der Entwicklung)
- Schneller HMR durch granulare Modul-Updates
- Rollup-basiertes Production-Build mit Tree-Shaking und Code-Splitting
- Erstklassige TypeScript- und React-Unterstützung

### UI-Framework: React 19

React wird als UI-Framework verwendet:

- Komponentenbasiertes Modell passt zur hexagonalen Architektur des Backends
- Großes Ökosystem (ShadCN, React Router, etc.)
- TypeScript-Integration ausgereift

### Projektstruktur: Single package.json

Backend und Frontend leben in einem Projekt mit einer einzigen `package.json`. Alle Frontend-Dependencies sind `devDependencies`, da Vite sie zur Build-Zeit in statische Dateien bundelt — die Production-Runtime braucht nur Express und Prisma.

```
app/
├── src/
│   ├── adapters/        ← Backend (Inbound/Outbound)
│   ├── domain/          ← Backend (Model, Ports, Services)
│   ├── app.ts           ← Backend Entry
│   ├── index.ts
│   └── frontend/        ← Frontend (Vite + React)
│       ├── App.tsx
│       ├── main.tsx
│       ├── app.css
│       ├── components/
│       ├── pages/
│       ├── lib/
│       ├── index.html
│       ├── vite.config.ts
│       └── tsconfig.json
├── package.json         ← Einzige package.json
├── tsconfig.json        ← Backend TypeScript
```

- Eine `package.json`, ein `npm install` — kein Workspace-Setup
- Zwei tsconfigs (technisch notwendig: Backend=CommonJS+Emit, Frontend=ESM+noEmit+JSX)
- Scripts: `npm run dev:frontend`, `npm run build:frontend`, `npm run build:all`

### TypeScript-Konfiguration

Backend und Frontend benötigen fundamental unterschiedliche TypeScript-Settings:

| Setting | Backend (`tsconfig.json`) | Frontend (`src/frontend/tsconfig.json`) |
|---------|---------------------------|----------------------------------------|
| `module` | `commonjs` | `esnext` |
| `jsx` | — | `react-jsx` |
| `moduleResolution` | Node (default) | `bundler` |
| `noEmit` | `false` (emittiert JS) | `true` (Vite baut) |

Jest nutzt eine eigene Inline-tsconfig in `jest.config.js` und ist davon unabhängig.

### Vite Dev-Server Proxy

Im Development proxied Vite API-Requests an das Express-Backend:

```typescript
server: {
  proxy: {
    '/api': 'http://localhost:3000',
    '/webhooks': 'http://localhost:3000',
    '/health': 'http://localhost:3000',
    '/principles': 'http://localhost:3000',
  }
}
```

In Production liefert Express die gebauten Frontend-Assets als statische Dateien aus (`express.static` + SPA-Fallback auf `index.html`).

### Docker: 3-Stage Build

Das `Dockerfile` nutzt drei Stages:

1. **frontend-build**: `npm ci`, `vite build` → statische Assets
2. **backend-build**: `npm ci`, `prisma generate`, `tsc` → `dist/`
3. **runtime**: `npm ci --omit=dev`, kopiert `dist/` + `public/` (Frontend) + Prisma

## Konsequenzen

- **Positiv:** Kein separates Repository nötig — Frontend und Backend bleiben synchron
- **Positiv:** Eine `package.json` — einfaches Onboarding, kein Workspace-Overhead
- **Positiv:** Vite Dev-Server bietet sub-second HMR
- **Positiv:** Production-Build erzeugt optimierte Assets (Hashing, Minification, Code-Splitting)
- **Trade-off:** Zwei tsconfigs sind technisch notwendig (inkompatible Compiler-Settings)
- **Trade-off:** Proxy-Konfiguration muss bei neuen API-Routes aktualisiert werden
