# ADR-002: Test-Infrastruktur mit Jest und Supertest

**Status:** Accepted
**Datum:** 2026-05-28

## Kontext

Das Projekt benötigt eine Test-Infrastruktur, die TDD ermöglicht. Es gibt zwei Kategorien von Tests:

1. **Unit-Tests** für Domain-Services (isoliert, mit Mock-Ports)
2. **Integrationstests** für HTTP/Webhook-Adapter (echte HTTP-Requests gegen Express-App)

## Entscheidung

### Framework: Jest + ts-jest + Supertest

- **Jest** als Test-Runner und Assertion-Library (inkl. Mocking via `jest.fn()`)
- **ts-jest** für TypeScript-Transformation ohne separaten Build-Schritt
- **Supertest** für HTTP-Integrationstests gegen Express-Apps ohne laufenden Server

### Co-Located Tests

Test-Dateien liegen direkt neben den Quell-Dateien (`*.test.ts`), nicht in einem separaten `__tests__`-Ordner:

```
src/domain/services/
├── FrameworkActivationService.ts
├── FrameworkActivationService.test.ts
├── WorkItemReminderService.ts
└── WorkItemReminderService.test.ts
```

**Begründung:** Kürzere Import-Pfade, sofortige Sichtbarkeit ob Tests existieren, einfacheres Refactoring bei Umbenennungen.

### TypeScript-Konfiguration (Dual-tsconfig)

Zwei tsconfig-Dateien trennen IDE-Erfahrung von Production-Build:

| Datei | Zweck | Besonderheit |
|---|---|---|
| `tsconfig.json` | IDE + ts-jest | `types: ["node", "jest"]` — erkennt Jest-Globals |
| `tsconfig.build.json` | `npm run build` | `exclude: ["**/*.test.ts", "src/test"]` — keine Tests in `dist/` |

**Begründung:** TypeScript 6 mit ts-jest 29 erfordert explizite `types`-Deklaration für Jest-Globals. Die `preset: 'ts-jest'`-Konfiguration allein reicht nicht aus — die Jest-Config verwendet daher eine inline-tsconfig mit `types: ['jest', 'node']`.

### Test-Helpers

Wiederverwendbare Factory-Funktionen in `src/test/helpers.ts`:

- `createMockNotificationPort()` — gemockter `ITeamNotificationPort`
- `createMockInstallationRepo()` — gemockter `IInstallationRepository`
- `createTestInstallation()` — Standard-Installation mit optionalen Overrides

### Integrationstests

Adapter-Tests bauen eine isolierte Mini-Express-App mit Stub-Ports auf. Kein Server wird gestartet — Supertest nutzt die App-Instanz direkt:

```typescript
const app = express();
const adapter = new WebhookAdapter(mockPort);
app.post('/webhooks', (req, res) => adapter.handle(req, res));
const res = await request(app).post('/webhooks').send({...});
```

## Konsequenzen

- **Positiv:** Domain-Tests sind schnell und vollständig isoliert
- **Positiv:** Integrationstests validieren echtes HTTP-Verhalten ohne laufenden Server
- **Positiv:** Co-Location macht fehlende Tests sofort sichtbar
- **Trade-off:** Dual-tsconfig erfordert Awareness bei neuen TypeScript-Settings
- **Trade-off:** `types: ["node", "jest"]` in `tsconfig.json` schränkt Auto-Discovery ein — neue `@types`-Pakete müssen explizit hinzugefügt werden
