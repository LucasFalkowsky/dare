# ADR-006: tRPC für Frontend-Backend-Kommunikation

**Status:** Accepted
**Datum:** 2026-06-08

## Kontext

DARE nutzt aktuell klassische REST-Endpoints (Express-Router), die vom Frontend per `fetch()` angesprochen werden. Dabei treten typische Probleme auf, die in vielen REST-basierten Fullstack-Anwendungen bekannt sind:

1. **Keine geteilten Typen:** Request- und Response-Typen müssen manuell im Frontend und Backend synchron gehalten werden. Änderungen am Backend-API (z.B. ein umbenanntes Feld) führen erst zur Laufzeit zu Fehlern.
2. **Kein Contract zwischen Client und Server:** Es existiert kein Schema, das beide Seiten bindet. OpenAPI/Swagger wäre eine Option, erfordert aber zusätzlichen Tooling-Aufwand (Code-Generierung, Schema-Pflege).
3. **Boilerplate auf beiden Seiten:** Im Backend muss jeder Endpoint manuell registriert werden (Route, Method, Request-Parsing, Validation, Response-Serialisierung). Im Frontend muss jeder API-Call separat typisiert und implementiert werden.
4. **Fehlende Input-Validierung am API-Boundary:** Die bestehenden Controller validieren Eingaben nicht systematisch. Zod ist als Dependency installiert, wird aber nicht genutzt.
5. **Keine automatische Fehlerbehandlung:** HTTP-Statuscodes, Error-Response-Formate und Fehlertypen werden manuell und inkonsistent gehandhabt.

Diese Probleme betreffen ausschließlich die **app-interne Kommunikation** zwischen dem React-Frontend und dem Express-Backend. Externe APIs (Webhooks von GitHub/GitLab/Jira) bleiben weiterhin REST-basiert, da tRPC für externe Konsumenten nicht geeignet ist.

## Entscheidung

Wir führen **tRPC** als Kommunikationsschicht zwischen Frontend und Backend ein. tRPC ersetzt die manuellen REST-Endpoints für app-interne Requests.

### Warum tRPC statt klassischem REST?

| Problem (REST) | Lösung (tRPC) |
|---|---|
| Typen manuell synchron halten | End-to-End Type-Safety: TypeScript-Typen werden vom Server-Router **inferiert** und stehen im Client ohne Code-Generierung zur Verfügung |
| Kein API-Contract | Der tRPC-Router **ist** der Contract — Änderungen am Server brechen sofort den Client-Build |
| Boilerplate (Route-Registration, fetch-Wrapper) | Prozeduren werden deklarativ definiert; der Client ruft sie als typisierte Funktionen auf |
| Keine Input-Validierung | Zod-Schemas werden direkt in der Prozedur-Definition als `.input()` angegeben — Validierung erfolgt automatisch |
| Inkonsistente Fehlerbehandlung | tRPC standardisiert Fehler über `TRPCError` mit einheitlichen Codes (`NOT_FOUND`, `BAD_REQUEST`, etc.) |
| Separate API-Dokumentation nötig | Die Typen **sind** die Dokumentation — IDE-Autocomplete zeigt verfügbare Prozeduren, Parameter und Rückgabetypen |

### Warum nicht OpenAPI / GraphQL?

- **OpenAPI/Swagger:** Löst das Typproblem, erfordert aber einen Code-Generator (z.B. `openapi-typescript-codegen`), Schema-Pflege und zusätzliche Build-Schritte. Sinnvoll für öffentliche APIs mit externen Konsumenten — Overhead für eine interne Fullstack-App.
- **GraphQL:** Mächtig für komplexe Datenabfragen mit variablen Shapes. DARE hat aktuell einfache CRUD-Operationen, die keine flexible Query-Sprache benötigen. GraphQL bringt eine eigene Schema-Sprache, einen Runtime-Layer und zusätzliche Abhängigkeiten mit.
- **tRPC:** Leichtgewichtig, kein Code-Generator, kein separates Schema. Nutzt TypeScript direkt als Contract. Ideal für Monorepo-/Monolith-Setups, in denen Frontend und Backend denselben TypeScript-Kontext teilen.

### Integration in die hexagonale Architektur

tRPC ersetzt die bisherigen Express-Controller als **Inbound-Adapter**. Die Architekturschichtung bleibt erhalten:

```
src/
├── domain/
│   ├── ports/inbound/       ← Unverändert (IPrinciplePort, IHealthPort)
│   └── services/            ← Unverändert (PrincipleService, etc.)
├── adapters/
│   ├── inbound/
│   │   ├── trpc/            ← NEU: tRPC-Router als Inbound-Adapter
│   │   │   ├── router.ts        Haupt-Router (appRouter)
│   │   │   ├── principle.ts     Principle-Prozeduren (query/mutation)
│   │   │   ├── health.ts        Health-Prozeduren
│   │   │   ├── context.ts       tRPC-Context (DI der Ports)
│   │   │   └── trpc.ts          tRPC-Instanz + Base-Procedures
│   │   └── webhook/         ← Bleibt REST (externe Konsumenten)
│   └── outbound/            ← Unverändert (Prisma, Stubs)
```

Der tRPC-Router delegiert wie bisher an die Inbound-Ports der Domain. Er führt **keine** Business-Logik aus:

```typescript
// adapters/inbound/trpc/principle.ts
export const principleRouter = router({
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.principlePort.getAllPrinciples();
  }),

  getById: publicProcedure
    .input(z.object({ principleId: z.string().uuid() }))
    .query(({ ctx, input }) => {
      return ctx.principlePort.getPrincipleById(input.principleId);
    }),

  create: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string(),
      category: z.string(),
    }))
    .mutation(({ ctx, input }) => {
      return ctx.principlePort.createPrinciple(input);
    }),
});
```

### Frontend-Integration

Im Frontend wird der tRPC-Client als typisierter Proxy genutzt. Kein manuelles `fetch()`, keine doppelten Type-Definitionen:

```typescript
// Frontend: Typsicherer API-Aufruf
const principles = await trpc.principle.getAll.query();
//    ^? Principle[] — Typ wird vom Server inferiert

const single = await trpc.principle.getById.query({ principleId: '...' });
//    ^? Principle | null — Compile-Error wenn principleId fehlt
```

Für React wird `@trpc/react-query` mit TanStack Query eingesetzt, was Caching, Optimistic Updates und Loading-States mitbringt.

### Transport

tRPC wird über den bestehenden Express-Server als Middleware eingebunden (`/trpc/*`). Kein separater Server nötig:

```typescript
// app.ts
import { createExpressMiddleware } from '@trpc/server/adapters/express';

app.use('/trpc', createExpressMiddleware({ router: appRouter, createContext }));
```

Der Vite Dev-Server proxied `/trpc` analog zu den bisherigen API-Pfaden.

## Konsequenzen

- **Positiv:** End-to-End Type-Safety ohne Code-Generierung — Typ-Fehler werden zur Compile-Zeit erkannt
- **Positiv:** Zod-Input-Validierung ist in die Prozedur-Definition integriert — kein separater Validierungs-Layer nötig
- **Positiv:** Deutlich weniger Boilerplate als manuelle Express-Routes + fetch-Calls
- **Positiv:** IDE-Autocomplete für alle API-Prozeduren im Frontend (Parameter, Rückgabetypen, Fehlerfälle)
- **Positiv:** Passt zur bestehenden hexagonalen Architektur — tRPC-Router ist ein Inbound-Adapter wie der bisherige HTTP-Controller
- **Positiv:** Zod ist bereits als Dependency installiert und wird nun produktiv genutzt
- **Trade-off:** tRPC eignet sich nur für interne Kommunikation — externe APIs (Webhooks) bleiben REST
- **Trade-off:** Kopplung an TypeScript auf beiden Seiten (bei DARE gegeben, da Monolith mit geteiltem Kontext)
- **Trade-off:** Zusätzliche Abhängigkeiten (`@trpc/server`, `@trpc/client`, `@trpc/react-query`, `@tanstack/react-query`)
- **Trade-off:** Team muss sich mit tRPC-Konzepten (Router, Procedures, Context) vertraut machen
