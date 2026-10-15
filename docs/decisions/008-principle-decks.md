# ADR-008: Principle Decks

**Status:** Accepted
**Datum:** 2026-06-28

## Kontext

Prinzipien sind aktuell global und unstrukturiert. Verschiedene Projekte benoetigen kuenftig eigene Zusammenstellungen von Prinzipien mit projektspezifischem Kontext.

## Entscheidung

Einfuehrung des Deck-Konzepts als Verbund von Prinzipien. Ein **Deck** buendelt Standard- und Custom-Prinzipien und erlaubt pro Prinzip einen projektspezifischen Context.

### Kernregeln

- **Standard-Prinzipien** (Seed-Daten, `isStandard: true`) sind schreibgeschuetzt — sie koennen weder bearbeitet noch geloescht werden.
- **Custom-Prinzipien** (`isStandard: false`) existieren nur im Deck-Kontext und koennen frei erstellt und bearbeitet werden.
- Jedes Prinzip im Deck kann einen **Project Context** erhalten, der den Anwendungsbezug beschreibt.

### Datenmodell

| Entity | Beschreibung |
|---|---|
| `Principle` (erweitert) | Neues Feld `isStandard` zur Unterscheidung Standard/Custom |
| `Deck` (neu) | Container fuer eine projektspezifische Prinzipien-Zusammenstellung |
| `DeckPrinciple` (neu) | Zuordnungstabelle mit optionalem `projectContext` |

### API-Design

- `principle.getAll` liefert weiterhin nur Standard-Prinzipien.
- Neue `deck.*` Endpunkte fuer CRUD auf Decks und deren Prinzipien-Zuordnungen.

## Konsequenzen

- **Positiv:** Projekte koennen eigene Decks pflegen mit projektspezifischem Kontext.
- **Positiv:** Standard-Prinzipien bleiben konsistent ueber alle Decks hinweg.
- **Positiv:** Custom-Prinzipien bieten Flexibilitaet fuer projektspezifische Anforderungen.
- **Trade-off:** Zusaetzliche Komplexitaet durch Deck-Verwaltung und Zuordnungstabelle.
