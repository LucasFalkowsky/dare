# ADR-009: Stammdaten-Architektur fuer Prinzipien

**Status:** Accepted
**Datum:** 2026-07-02
**Aktualisiert:** 2026-07-20

## Kontext

Prinzipien werden als Stammdaten in der Datenbank gefuehrt. Aktuell speichert die `Principle`-Tabelle ein `description`-Feld als Freitext, das sowohl als fachliche Beschreibung als auch als Anzeigetext dient. Bei Mehrsprachigkeit ist unklar, ob die DB oder das Frontend die Quelle der Wahrheit fuer Anzeigetexte ist. Zudem erschwert Freitext eine strukturierte Suche und Filterung.

Zusaetzlich benoetigt das Frontend eine Moeglichkeit, Prinzipien innerhalb eines Decks zu priorisieren (Reihenfolge/Ranking), um die Relevanz fuer ein konkretes Projekt abzubilden.

## Entscheidung

### 1. DB = Stammdaten

Die `Principle`-Tabelle speichert ausschliesslich technische Stammdaten:

| Feld | Typ | Beschreibung |
|---|---|---|
| `principleId` | PK | Eindeutiger Identifier |
| `name` | string | Technischer Identifier (z.B. `lean-waste-reduction`) |
| `category` | string? | Technischer Gruppenschluessel zum Clustern (z.B. `lean`, `agile`) |
| `keywords` | string[] | Schlagworte fuer strukturierte Suche/Filterung — ersetzt das bisherige `description`-Feld |
| `isStandard` | boolean | Kennzeichnung Standard- vs. Custom-Prinzip |
| `deletedAt` | timestamp? | Soft-Delete-Zeitstempel |

### 2. Frontend = Anzeigetexte

Ein Locale-Mapping im Frontend loest anhand der `principleId` die lokalisierten Texte (Titel, Beschreibung) auf. Die `category` dient als Schluessel, um die lokalisierte Gruppenbezeichnung aufzuloesen. Die DB liefert keine Anzeigetexte — das Frontend ist die alleinige Quelle fuer Praesentationstexte.

### 3. Decks = Annotationen + Ranking

`DeckPrinciple` speichert die Zuordnung, projektspezifische Annotation und die Priorisierung:

| Feld | Typ | Beschreibung |
|---|---|---|
| `deckId` | FK | Verweis auf das Deck |
| `principleId` | FK | Verweis auf das Prinzip |
| `projectContext` | string? | Projektspezifische Annotation |
| `rank` | int? | Position/Prioritaet innerhalb des Decks (aufsteigend sortiert) |

Keine duplizierten Prinzip-Texte in der Zuordnungstabelle.

### 4. Operationen-Trennung

Ranking-Updates und ProjectContext-Updates werden ueber getrennte Endpoints abgewickelt:

- **`updateProjectContext`**: Aktualisiert den Projektkontext eines einzelnen Prinzips
- **`rankPrinciples`**: Setzt die Reihenfolge aller Prinzipien eines Decks in einer Transaktion

Diese Trennung verhindert versehentliche Ueberschreibungen bei Batch-Saves und erlaubt dem Frontend, Drag-and-Drop-Reorder unabhaengig von Textaenderungen zu persistieren.

## Konsequenzen

- **Positiv:** Klare Trennung zwischen Stammdaten (DB) und Praesentation (Frontend).
- **Positiv:** Mehrsprachigkeit wird moeglich, ohne das DB-Schema zu aendern.
- **Positiv:** Keywords ermoeglichen strukturierte Suche und Filterung gegenueber Freitext.
- **Positiv:** Ranking ermoeglicht projektspezifische Priorisierung ohne Aenderung der Stammdaten.
- **Positiv:** Getrennte Endpoints fuer Ranking und Context verhindern Race-Conditions bei parallelen UI-Operationen.
- **Trade-off:** Das Frontend muss fuer jede `principleId` und `category` ein Locale-Mapping vorhalten.
- **Trade-off:** Unbekannte IDs oder Kategorien (z.B. Custom-Prinzipien) benoetigen eine Fallback-Strategie im Frontend.
