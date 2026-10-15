# ADR-010: Angleichung der UI an GitHub Primer

**Status:** Accepted
**Datum:** 2026-10-13

## Kontext

DARE soll als bedienbarer Prototyp mit Entwicklerteams getestet werden. Diese Teams arbeiten taeglich in GitHub. Je naeher die Oberflaeche an GitHubs Designsprache liegt, desto geringer ist die Einstiegshuerde: Bedeutung von Icons, Zustandsfarben, Listenzeilen und Buttons muss nicht neu erlernt werden.

Der bisherige Stand (ADR-004) war das unveraenderte ShadCN-Default-Theme: reine Graustufen (`oklch(… 0 0)`), 10px Radius, Inter Variable, Karten in Karten. Funktional korrekt, aber visuell beliebig — und damit ohne Transfer aus dem Arbeitsalltag der Testteams.

## Entscheidung

Die UI wird an **GitHub Primer** angeglichen — auf drei Ebenen, ohne den bestehenden Stack zu ersetzen.

### 1. Design-Tokens

`src/frontend/app.css` fuehrt die Primer-Farbskalen als CSS-Variablen (`--canvas-*`, `--fg-*`, `--border-*`, `--accent-*`, `--success-*`, `--danger-*`, `--done-*`, `--attention-*`, `--btn-*`) fuer Light und Dark. Die ShadCN-Tokens (`--background`, `--primary`, …) bleiben als **Aliase auf diese Skalen** bestehen, damit die vorhandene Komponentenschicht unveraendert weiterfunktioniert.

```css
:root {
  --canvas-subtle: #f6f8fa;
  --border-default: #d1d9e0;
  --accent-fg: #0969da;
  --btn-primary-bg: #1f883d;

  --background: var(--canvas-default);   /* ShadCN-Alias */
  --primary: var(--btn-primary-bg);
}
```

Die Werte werden **als Literale gepflegt**, nicht per `@primer/primitives` eingebunden: Das Paket liefert seine Tokens in einem eigenen Format, das sich nicht ohne Build-Schritt in Tailwind v4s `@theme inline` uebersetzen laesst. Ebenso wird `@primer/react` nicht eingesetzt — es bringt eine eigene CSS-in-JS-Laufzeit mit und kollidiert mit Tailwind/ShadCN.

Weitere Token-Aenderungen: Radius durchgaengig 6px (statt 10px), Basis-Schriftgroesse 14px, Primer-Buttonschatten (`0 1px 0 rgba(31,35,40,0.04)`).

### 2. Primer-Komponentenschicht

Neu in `components/ui/`:

| Komponente | Primer-Vorbild |
|---|---|
| `box.tsx` (`Box`, `BoxHeader`, `BoxRow`, `BoxGroupHeader`, …) | `Box` — der umrandete Container mit `canvas.subtle`-Kopfstreifen und Zeilen durch Haarlinien statt Gaps |
| `flash.tsx` | `Flash` — das Inline-Banner fuer Hinweise |
| `badge.tsx` (erweitert) | `Label` (umrandete Pille) und `Counter` (gefuellte graue Pille) |
| `button.tsx` (restyled) | Primer-Buttons: gruener Primary, grauer Default mit Rahmen, `invisible`, `danger`; 32px/28px Hoehen |

### 3. Issue-Listen-Idiom

Das Deck wird als GitHub-Issue-Liste gelesen — die vertrauteste Oberflaeche der Zielgruppe:

- `StepIndicator` → Primer `UnderlineNav`: Tabs auf einer Haarlinie, aktiver Tab mit 2px-Indikator in `#fd8c73`, Zaehler-Pille pro Tab
- `ProjectDeck` → eine `Box` mit Zustandszaehlern im Kopf (`⊙ 7 relevant` / `⊙ 2 beiseitegelegt`) und Zeilen statt verschachtelter Karten; beiseitegelegte Grundsaetze unter einem `BoxGroupHeader`
- `PrincipleRowCard` → Issue-Zeile: Statusicon (gruener `CircleDot` relevant, violettes `CircleCheck` beiseitegelegt), fetter Titel, Metazeile `P001 · interpretiert`, Label-Pille rechts, Kommentarzaehler bei vorhandener Interpretation
- Die Interpretation wird zur **Issue-Kommentarbox**: umrandet, mit `canvas.subtle`-Kopf, Textarea und gruenem Submit
- `EstimationPoker` → sortierbare Liste wie GitHub Projects: Griff (`GripVertical`) links neben der Rangnummer, gezogene Zeile ausgegraut, blaue Einfuegelinie an der Kante, an der die Zeile landet

### Zwei Eingabewege fuer die Priorisierung

Gezogen wird per nativer HTML5-Drag-and-Drop-API — ohne zusaetzliche Bibliothek. Den Drag startet **nur der Griff**, nicht die ganze Zeile: ein `draggable` Elternelement unterbindet Textselektion in den Eingabefeldern darunter, und die Interpretations-Textarea liegt in genau dieser Zeile. Das Drag-Bild wird per `setDragImage` trotzdem auf die gesamte Zeile gesetzt.

Die bestehende Bedienung (Zeile antippen → Pfeile hoch/runter) bleibt **gleichwertig erhalten**, weil HTML5-Drag-and-Drop weder auf Touch-Geraeten noch per Tastatur funktioniert. Der Griff ist deshalb `aria-hidden`: Fuer assistive Technologie ist der Pfad ueber Auswahl und Buttons der vollstaendige.

Semantisch unterscheiden sich beide: Die Pfeile **tauschen** mit dem Nachbarn, das Ziehen **verschiebt** an die Zielposition (`splice`).

### Systemschriftart statt Inter

`--font-sans` ist jetzt GitHubs Stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", …`). `@fontsource-variable/inter` und sein Import in `main.tsx` entfallen.

Das **ersetzt den Font-Teil von ADR-005**. Die dortige DSGVO-Begruendung bleibt gewahrt und wird sogar strenger erfuellt: Systemschriften erzeugen ueberhaupt keinen Request, auch keinen an den eigenen Server. Die React-Router-Entscheidung aus ADR-005 ist unberuehrt.

### Bewusst nicht uebernommen

Die **GitHub-App-Shell** (dunkler Global-Header, Repo-Breadcrumb, Suche, Avatar-Menue) wird nicht gebaut. Sie liefert die groesste Wiedererkennung, setzt aber Konzepte voraus, die DARE nicht hat (Organisation, Repository, angemeldeter Nutzer). Sie bleibt ein moeglicher naechster Schritt, sobald das Datenmodell diese Entitaeten kennt.

Ebenso werden **keine GitHub-Marken** verwendet: kein Octocat, kein Logo, kein Wortmarken-Branding. Angeglichen wird die Designsprache, nicht die Markenidentitaet.

## Konsequenzen

- **Positiv:** Entwicklerteams erkennen Zustaende, Aktionen und Listenstrukturen ohne Erklaerung — genau das Ziel des Prototyps
- **Positiv:** Primer-Farben sind auf Kontrast geprueft; die Zustandsfarben (gruen/violett/rot/gelb) tragen Bedeutung statt nur Dekoration
- **Positiv:** Dark Mode ist durch die `.dark`-Skalen vollstaendig vorbereitet
- **Positiv:** Keine neue Laufzeit-Abhaengigkeit; eine Abhaengigkeit (`@fontsource-variable/inter`, ca. 100 KB Fonts) entfaellt
- **Trade-off:** Primer-Werte sind Literale — Aenderungen an GitHubs Palette muessen manuell nachgezogen werden
- **Trade-off:** Die ShadCN-Tokens sind jetzt Aliase; wer `--primary` liest, erhaelt Primer-Gruen und nicht mehr Schwarz
- **Trade-off:** Ohne App-Shell bleibt die Angleichung unvollstaendig — die Seite sieht aus wie ein GitHub-Inhaltsbereich ohne GitHub darum herum
- **Risiko:** Eine zu genaue GitHub-Anmutung kann bei Testteams Funktionen suggerieren, die DARE nicht hat (Suche, Benachrichtigungen, PRs). Im Testprotokoll ist festzuhalten, ob Teilnehmende solche Elemente erwarten
