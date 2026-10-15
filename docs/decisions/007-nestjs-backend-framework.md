# ADR-007: Migration von Express zu NestJS

**Status:** Accepted
**Datum:** 2026-06-08

## Kontext

DARE nutzt Express.js mit manueller Dependency Injection in `app.ts` (siehe ADR-001). Die hexagonale Architektur mit Ports & Adapters ist sauber umgesetzt: Domain-Ports als Interfaces, Services mit Constructor Injection, Adapter als Implementierungen.

Mit wachsender Codebasis zeigen sich Grenzen der manuellen Verdrahtung:

- Jeder neue Service/Adapter erfordert manuelles Wiring in `app.ts`
- Das Bridge-Pattern für `IWorkflowEventPort` skaliert nicht gut
- Route-Registration erfolgt manuell pro Controller
- Kein standardisiertes Lifecycle-Management (z.B. `onModuleDestroy` für DB-Disconnect)

## Entscheidung

Wir migrieren das Backend von Express zu **NestJS**. NestJS nutzt Express unter der Haube, bietet aber einen standardisierten DI-Container, dekorator-basierte Controller und ein modulares System.

### Mapping auf hexagonale Architektur

| Hexagonal-Konzept | NestJS-Konzept |
|---|---|
| Domain-Service | `@Injectable()` Provider |
| Inbound-Adapter | `@Controller()` |
| Outbound-Adapter | `@Injectable()` Provider |
| Port (Interface) | Injection Token (string-basiert) |
| Manuelle DI in `app.ts` | `@Module()` Provider-Array |
| Route-Registration | `@Get()`, `@Post()` Dekoratoren |

### Injection Tokens

Da TypeScript-Interfaces zur Runtime nicht existieren, nutzen wir string-basierte Injection Tokens (`PRINCIPLE_REPOSITORY`, `INSTALLATION_REPOSITORY`, etc.) in Kombination mit `@Inject()`.

### Module

Jeder Bounded Context wird ein NestJS-Modul:

- `PersistenceModule` — PrismaClient, Repositories
- `PrincipleModule` — PrincipleService, PrincipleController
- `WebhookModule` — FrameworkActivationService, WorkItemReminderService, WebhookAdapter
- `HealthModule` — HttpAdapter (Health-Controller)

## Konsequenzen

- **Positiv:** Standardisierter DI-Container statt manueller Verdrahtung
- **Positiv:** Dekorator-basierte Controller statt manueller Route-Registration
- **Positiv:** Modulares System mit expliziten Imports/Exports
- **Positiv:** Lifecycle-Hooks (`onModuleDestroy`) fuer PrismaClient-Disconnect
- **Positiv:** `@nestjs/testing` fuer Controller-Integration-Tests
- **Positiv:** Domain-Layer bleibt unabhaengig — `@Injectable()` ist nur Metadaten-Annotation
- **Trade-off:** Zusaetzliche Framework-Abhaengigkeit (NestJS, reflect-metadata, rxjs)
- **Trade-off:** Dekoratoren erfordern `experimentalDecorators` und `emitDecoratorMetadata`
