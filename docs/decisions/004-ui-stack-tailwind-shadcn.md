# ADR-004: UI-Stack — Tailwind CSS v4 + ShadCN UI

**Status:** Accepted
**Datum:** 2026-06-08

## Kontext

Das Frontend benötigt ein konsistentes Styling-System und wiederverwendbare UI-Komponenten. Die Lösung soll:

- Schnelle Entwicklung ohne Design-System-Overhead ermöglichen
- Barrierefreie (a11y) Komponenten out-of-the-box bieten
- Volle Kontrolle über den Komponenten-Code geben (kein Black-Box-Framework)

## Entscheidung

### Tailwind CSS v4

Tailwind CSS v4 wird für das Styling eingesetzt:

- **CSS-basierte Konfiguration** statt `tailwind.config.js` — Konfiguration erfolgt über `@theme` in CSS
- **Vite-Plugin** (`@tailwindcss/vite`) statt PostCSS — direktere Integration, schnelleres HMR
- Utility-First-Ansatz reduziert CSS-Dateigröße durch Wiederverwendung

```css
@import "tailwindcss";

@theme inline {
  --font-sans: 'Inter Variable', sans-serif;
}
```

### ShadCN UI

ShadCN UI wird als Komponenten-Bibliothek eingesetzt:

- **Kein npm-Paket** — Komponenten werden als Source-Code in `components/ui/` kopiert
- Basiert auf **Radix UI Primitives** (barrierefreie, unstyled Headless-Komponenten)
- Styling via Tailwind CSS — konsistentes Theming über CSS-Variablen
- `cn()`-Helper (clsx + tailwind-merge) für bedingte Klassen
- Neue Komponenten via `cd src/frontend && npx shadcn add <name>`

```
src/frontend/
├── components/
│   ├── Layout.tsx
│   └── ui/
│       ├── button.tsx    ← ShadCN-generiert, vollständig anpassbar
│       └── card.tsx
├── lib/
│   └── utils.ts          ← cn()-Helper
├── components.json        ← ShadCN-Konfiguration
```

## Konsequenzen

- **Positiv:** Vollständige Kontrolle über UI-Komponenten (kein Vendor-Lock-in)
- **Positiv:** Radix-Primitives garantieren Barrierefreiheit (Keyboard-Navigation, ARIA)
- **Positiv:** Tailwind v4 eliminiert JavaScript-Config — einfachere Build-Pipeline
- **Trade-off:** ShadCN-Komponenten müssen manuell aktualisiert werden (kein `npm update`)
- **Trade-off:** Tailwind-Utility-Klassen erfordern Einarbeitung für Entwickler ohne Tailwind-Erfahrung
