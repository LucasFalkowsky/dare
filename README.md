# DARE — Deliberative, Agile and Responsive Ethics

DARE empfängt Webhook-Events von Plattformen wie GitHub, GitLab oder Jira und reagiert mit automatisierten Workflows: Framework-Aktivierung, Work-Item-Reminders und mehr.

## Architektur

Das Projekt folgt einer hexagonalen Architektur (Ports & Adapters) mit **NestJS** als Backend-Framework (siehe [ADR-007](docs/decisions/007-nestjs-backend-framework.md)). Backend und Frontend leben in einem Projekt mit einer einzigen `package.json`:

```
src/
├── domain/
│   ├── model/          Entities (Installation, Principle)
│   ├── ports/
│   │   ├── inbound/    Interfaces für Domain-Services
│   │   ├── outbound/   Interfaces für externe Systeme
│   │   └── injection-tokens.ts  NestJS DI-Tokens
│   └── services/       Business-Logik (@Injectable)
├── adapters/
│   ├── inbound/        NestJS-Controller (HTTP, Webhooks)
│   └── outbound/       Persistenz (Prisma) & Notification-Stubs
├── app.module.ts       NestJS Root-Modul
├── test/               Shared Test-Helpers
├── index.ts            NestJS Bootstrap
└── frontend/           React-Frontend (Vite)
    ├── App.tsx
    ├── main.tsx
    ├── app.css          Tailwind CSS + GitHub-Primer-Tokens (ADR-010)
    ├── components/ui/   ShadCN- und Primer-Komponenten (Box, Flash, Badge, Button)
    ├── lib/utils.ts     cn()-Helper
    ├── index.html
    └── vite.config.ts
```

### NestJS-Module

| Modul | Verantwortung |
|---|---|
| `AppModule` | Root-Modul, importiert alle Feature-Module |
| `PersistenceModule` | PrismaClient, Repositories (bindet an Injection-Tokens) |
| `PrincipleModule` | PrincipleService, PrincipleController |
| `WebhookModule` | FrameworkActivationService, WorkItemReminderService, WebhookAdapter |
| `HealthModule` | Health-Controller |

Architektur-Entscheidungen sind in `docs/decisions/` als ADRs dokumentiert.

## Voraussetzungen

- Node.js >= 22
- npm
- Docker (für PostgreSQL)

## Setup

```bash
cp .env.example .env
npm install
```

## Entwicklung

```bash
npm run dev
```

Dieses Kommando erledigt alles automatisch:

1. Startet den PostgreSQL-Container (`docker compose up`) und wartet auf den Healthcheck
2. Führt `prisma migrate deploy` aus, um das DB-Schema aktuell zu halten
3. Startet den NestJS-Backend-Server mit Auto-Reload (nodemon) auf `http://localhost:3000`
4. Startet den Frontend-Dev-Server (Vite) auf `http://localhost:5173`
5. Bei **Ctrl+C** werden alle Prozesse und Container gestoppt

Frontend und Backend können auch einzeln gestartet werden:

```bash
npm run dev:frontend    # Nur Vite Dev-Server (Port 5173)
```

Der Vite Dev-Server proxied API-Requests (`/principles`, `/webhooks`, `/health`) automatisch an das Backend auf Port 3000.

### API-Endpunkte

| Schnittstelle | Methode | Pfad | Beschreibung |
|---|---|---|---|
| REST | `GET` | `/principles` | Alle Principles abrufen |
| REST | `GET` | `/principles/:id` | Einzelnes Principle abrufen |
| REST | `POST` | `/principles` | Neues Principle anlegen |
| REST | `POST` | `/webhooks` | Webhook-Events von GitHub/GitLab/Jira |
| REST | `GET` | `/health` | Systemstatus |

### Webhook-Events

Der `x-event-type` Header bestimmt den Workflow:

- `framework.activated` — Framework-Setup anlegen
- `workitem.opened` — Reminder pinnen

Beispiel:

```bash
curl -X POST http://localhost:3000/webhooks \
  -H "Content-Type: application/json" \
  -H "x-event-type: framework.activated" \
  -d '{"installation": {"id": "1"}, "repository": {"owner": "acme", "name": "repo"}}'
```

## Webhooks lokal testen

Da GitLab Webhook-Events an eine öffentliche URL schickt, braucht die lokale Entwicklungsumgebung einen Tunnel. Das Projekt nutzt dafür [smee.io](https://smee.io).

### Einrichtung

1. **Smee-Channel erstellen** — Auf [https://smee.io](https://smee.io) einen neuen Channel anlegen (oder den vorhandenen aus `.env` nutzen).

2. **`SMEE_URL` in `.env` setzen:**

   ```
   SMEE_URL=https://smee.io/<dein-channel>
   ```

3. **Webhook in GitLab konfigurieren** — Im GitLab-Projekt unter *Settings → Webhooks* einen Webhook anlegen:

   | Feld | Wert |
   |---|---|
   | URL | Die `SMEE_URL` (z. B. `https://smee.io/dare-2026-27`) |
   | Secret token | Wert aus `GITLAB_WEBHOOK_SECRET` (optional) |
   | Trigger | *Issues events* aktivieren |

4. **Smee-Client starten:**

   ```bash
   npm run webhook:dev
   ```

   Dieser Befehl startet den `smee-client`, der Events von der Smee-URL empfängt und an `http://localhost:3000/webhooks/gitlab` weiterleitet.

5. **Backend starten** (in einem separaten Terminal):

   ```bash
   npm run dev
   ```

### Manuell testen (ohne GitLab)

Webhook-Events lassen sich auch direkt per `curl` simulieren:

```bash
# GitLab Issue Hook simulieren
curl -X POST http://localhost:3000/webhooks/gitlab \
  -H "Content-Type: application/json" \
  -H "x-gitlab-event: Issue Hook" \
  -H "x-gitlab-token: <dein-secret>" \
  -d '{
    "object_attributes": { "iid": 42 },
    "labels": [{ "title": "ethics:privacy" }],
    "project": { "path_with_namespace": "owner/repo" }
  }'

# Generischer Webhook (framework.activated)
curl -X POST http://localhost:3000/webhooks \
  -H "Content-Type: application/json" \
  -H "x-event-type: framework.activated" \
  -d '{"installation": {"id": "1"}, "repository": {"owner": "acme", "name": "repo"}}'
```

## Tests

```bash
npm test                    # Frontend + Backend
npm run test:frontend       # Nur Frontend (Vitest)
npm run test:frontend:watch # Frontend im Watch-Modus
npm run test:backend        # Nur Backend (Jest)
```

Das Projekt nutzt zwei Test-Runner:

- **Frontend (Vitest)** — Component-Tests mit React Testing Library in einer jsdom-Umgebung. Tests liegen co-located neben den Komponenten (`*.test.tsx`).
- **Backend (Jest)** — Integrations- und Unit-Tests mit ts-jest und `@nestjs/testing`. Startet automatisch einen separaten PostgreSQL-Test-Container (Port 5433), führt Migrationen aus und räumt nach Abschluss auf.

Tests liegen co-located neben den Quell-Dateien. Wiederverwendbare Test-Helpers befinden sich in `src/test/helpers.ts`.

## Build

```bash
npm run build           # Backend + Frontend
npm run build:backend   # Backend: TypeScript → dist/
npm run build:frontend  # Frontend: Type-Check + Vite → src/frontend/dist/
npm start               # Production-Server aus dist/
```

In Production liefert NestJS die gebauten Frontend-Assets als statische Dateien aus und nutzt ein SPA-Fallback auf `index.html`.

## Datenbank (PostgreSQL + Prisma)

Die Persistenzschicht nutzt PostgreSQL mit [Prisma](https://www.prisma.io/) als ORM. Das Schema liegt in `prisma/schema.prisma`.

| Befehl | Beschreibung |
|---|---|
| `npm run db:migrate` | Neue Migration erstellen und anwenden |
| `npm run db:generate` | Prisma Client neu generieren |
| `npm run db:studio` | Prisma Studio (DB-GUI) öffnen |

## Docker

| Befehl | Beschreibung |
|---|---|
| `npm run docker:up` | PostgreSQL + App starten |
| `npm run docker:down` | Container stoppen und entfernen |
| `npm run docker:test:up` | Test-Datenbank starten (Port 5433) |
| `npm run docker:test:down` | Test-Datenbank stoppen und entfernen |

### Konfigurationsdateien

| Datei | Zweck |
|---|---|
| `docker-compose.yml` | PostgreSQL + App (Entwicklung/Produktion) |
| `docker-compose.test.yml` | Separate Test-Datenbank |
| `Dockerfile` | 4-Stage Build (deps → build → prod-deps → runtime) |

## Deployment (Coolify)

Produktion läuft als Dockerfile-Build auf [Coolify](https://coolify.io): eine von Coolify
verwaltete PostgreSQL-Ressource plus die App auf Port 3000, die API und gebautes Frontend
ausliefert. Migrationen und der (idempotente) Seed laufen beim Container-Start, ein Deployment
braucht also keinen manuellen Schritt.

Vollständige Anleitung inkl. Environment-Variablen, Healthcheck und Webhooks:
**[docs/deployment-coolify.md](docs/deployment-coolify.md)**

Produktionsabbild lokal durchspielen (gleiches Dockerfile, gleiche Variablen wie in Coolify,
Plattform-Variablen kommen aus `.env`):

```bash
docker compose up -d --build
curl localhost:3000/health     # {"status":"ok","timestamp":"…"}
docker compose logs -f app     # Migration → Seed → Nest-Start
docker compose down
```

## Projektstruktur

| Datei | Zweck |
|---|---|
| `package.json` | Einzige package.json (Backend + Frontend) |
| `tsconfig.json` | Backend TypeScript-Config |
| `src/frontend/tsconfig.json` | Frontend TypeScript-Config |
| `src/frontend/vite.config.ts` | Vite-Config (Tailwind, Proxy, Alias, Vitest) |
| `jest.config.js` | Jest-Konfiguration (Backend) mit ts-jest |
| `prisma/schema.prisma` | Datenbank-Schema |
| `.env.example` | Environment-Template |
| `scripts/dev.sh` | Dev-Startup mit Docker-Lifecycle |
| `docs/decisions/` | Architecture Decision Records |
| `docs/deployment-coolify.md` | Deployment-Anleitung für Coolify |
