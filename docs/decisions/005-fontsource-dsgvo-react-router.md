# ADR-005: Fontsource (DSGVO-konform) + React Router

**Status:** Superseded — Font-Teil ersetzt durch [ADR-010](010-github-primer-ui-angleichung.md), Routing-Teil durch [ADR-012](012-how-to-seite-und-client-routing.md)

> Der Routing-Teil dieses ADR wurde nie umgesetzt: `react-router` war zu keinem Zeitpunkt
> installiert. Die hier vorgesehene Route `/principles` ist ausserdem nicht umsetzbar, weil
> `src/frontend/vite.config.ts` diesen Pfad im Dev-Server ans Backend proxied. ADR-012
> ersetzt den Abschnitt durch zwei Routen ueber die History-API.
**Datum:** 2026-06-08

## Kontext

Das Frontend benötigt eine konsistente Schriftart und Client-Side Routing. Datenschutzanforderungen (DSGVO) verbieten das Laden von Fonts über externe CDNs (Google Fonts), da dabei IP-Adressen an Dritte übermittelt werden.

## Entscheidung

### Fontsource mit Inter (Variable)

Fonts werden über **Fontsource** als npm-Paket (`@fontsource-variable/inter`) selbst gehostet:

- **DSGVO-konform**: Keine Requests an Google Fonts oder andere CDNs
- Font-Dateien werden im Build gebundlet und vom eigenen Server ausgeliefert
- **Inter Variable**: Einzelne Datei für alle Schriftschnitte (keine separaten Dateien für Regular, Bold, etc.)

```typescript
// src/frontend/main.tsx
import '@fontsource-variable/inter';
```

Die Font-Family wird in Tailwind CSS über `@theme inline` konfiguriert:

```css
@theme inline {
  --font-sans: 'Inter Variable', sans-serif;
}
```

### React Router v7

React Router wird für Client-Side Routing eingesetzt:

- **BrowserRouter** mit `<Routes>` und `<Route>` für deklarative Routen-Definition
- **`<Outlet />`** für geschachtelte Layouts (Navigation + Content)
- **`useParams()`** für dynamische Routen-Parameter (z.B. `/principles/:id`)

Routen-Struktur:

```
/                    → DashboardPage
/principles          → PrinciplesPage
/principles/:id      → PrincipleDetailPage
```

Alle Routen teilen sich ein gemeinsames Layout mit Navigation.

## Konsequenzen

- **Positiv:** Keine DSGVO-Risiken durch Drittanbieter-Font-CDNs
- **Positiv:** Variable Font reduziert Dateigröße (eine Datei statt mehrerer Schnitte)
- **Positiv:** React Router ermöglicht SPA-Navigation ohne vollständige Seitenreloads
- **Trade-off:** Font-Dateien erhöhen die Bundle-Größe (ca. 100 KB für Inter Variable)
- **Trade-off:** SPA-Routing erfordert Server-Konfiguration für Production (Catch-All auf `index.html`)
