# ADR-011: Ein Schritt statt zwei — Priorisieren im Deck, Drag per Halten

**Status:** Accepted
**Datum:** 2026-10-14
**Ersetzt:** Interaktionsteil von ADR-010 (`StepIndicator`, `EstimationPoker`, HTML5-Drag am Griff, Pfeil-Buttons)

## Kontext

Die Grundsatzarbeit war in zwei Schritte geteilt (ADR-010): „Aufbauen & Interpretieren" (Deck, Interpretation, Beiseitelegen) und „Priorisieren" (Reihenfolge festlegen). Beide zeigten dieselbe Liste derselben Zeilen — nur mit anderen Nebenelementen. Der Wechsel zwischen ihnen lief ueber eine `UnderlineNav` und zwei Buttons (`Priorisieren` / `Zurueck`), die Reihenfolge wurde am Ende des zweiten Schritts per `Speichern` geschrieben, waehrend die Interpretationen im ersten Schritt bereits automatisch gespeichert wurden.

Zwei Kosten daraus:

1. **Doppelte Liste.** Wer beim Priorisieren merkt, dass ein Grundsatz nicht passt, musste zurueck in Schritt 1, dort beiseitelegen und wieder vor. Interpretieren und Priorisieren sind in der Praxis dieselbe Taetigkeit: Man liest, versteht, und erst dadurch entsteht die Rangfolge.
2. **Zwei Eingabewege fuer dasselbe.** ADR-010 hielt neben dem Ziehen bewusst den Pfad „Zeile antippen → Pfeile hoch/runter" gleichwertig. In den Tests war das Ergebnis Zweideutigkeit: Ein Klick auf die Zeile loeste einmal eine Auswahl (Schritt 2) und einmal das Aufklappen (Schritt 1) aus — und der Drag startete nur am schmalen Griff, was kaum gefunden wurde.

## Entscheidung

### 1. Ein Schritt

`ProjectDeck` ist die ganze Ansicht. Die Position einer Zeile **ist** ihre Priorität; die Interpretation steht in derselben Zeile, aufgeklappt. `StepIndicator` und `EstimationPoker` entfallen samt `steps.*`- und `poker.*`-Uebersetzungen, ebenso die Buttons `Zurueck` / `Priorisieren` / `Speichern`.

Damit kein Speicherpunkt verlorengeht, wird die Rangfolge genauso automatisch geschrieben wie die Interpretationen: debounced (600 ms) nach jeder Umsortierung und nach jedem Wechsel der Relevanz — denn Beiseitelegen verschiebt alle folgenden Raenge. `AutoSaveIndicator` ist die einzige Speicheranzeige der Seite.

Das Backend bleibt unberuehrt: `deck.rankPrinciples` nimmt weiterhin die vollstaendige Liste der relevanten Grundsaetze mit ihrem Rang.

### 2. Die ganze Zeile ist der Griff — unterschieden wird ueber die Haltedauer

`useLongPressReorder` ersetzt die HTML5-Drag-and-Drop-API durch Pointer-Events:

- **Kurzer Klick** auf Zeilenflaeche → Zeile klappt auf (Dropdown)
- **Halten ≥ 180 ms**, dann bewegen → Zeile wird aufgenommen, die Zeile unter dem Zeiger ist das Ziel, Loslassen setzt sie dort ein (`splice`, kein Tauschen)
- Wandert der Zeiger **vor** Ablauf der Haltedauer mehr als 8 px, gilt die Geste als Scrollen und wird verworfen
- Der Klick, der ein Halten beendet, wird in `onClickCapture` geschluckt — ein Drag klappt die Zeile nie auf

Der Griff (`GripVertical`) bleibt als Affordanz stehen, ist aber dekorativ: Gezogen wird ueberall.

Pointer-Events statt HTML5-DnD aus drei Gruenden: Sie funktionieren auf Touch-Geraeten, die Haltedauer-Unterscheidung ist in HTML5-DnD nicht ausdrueckbar (`draggable` entscheidet der Browser beim `mousedown`), und ein `draggable`-Elternelement unterbindet die Textselektion in der Interpretations-Textarea darunter — der Grund, warum der Drag in ADR-010 ueberhaupt auf den Griff beschraenkt war.

`isRowGesture` haelt die Geste von Bedienelementen fern: In `button`, `a`, `input`, `textarea`, `select` und allem unter `[data-no-row-gesture]` — darunter der ganze aufgeklappte Detailbereich — startet weder ein Drag noch klappt ein Klick die Zeile zu.

### 3. Tastatur statt Pfeil-Buttons

Die sichtbaren Pfeil-Buttons entfallen. Ihr Zweck — Umsortieren ohne Maus — bleibt als `Alt` + `ArrowUp` / `ArrowDown` auf der fokussierten Zeile erhalten; der Aufklapp-Button der Zeile traegt `aria-keyshortcuts` und ist der Fokuspunkt dafuer. Die Zeile selbst wird **kein** zusaetzlicher Tabstop.

Waehrend eine Zeile getragen wird, setzt die Liste `touch-action: none`, damit die Geste auf Touch nicht in ein Scrollen kippt.

## Konsequenzen

- **Positiv:** Eine Liste, ein Speicherverhalten, eine Bedeutung des Klicks. Beiseitelegen und Umsortieren sind im selben Blick moeglich
- **Positiv:** Die Drag-Flaeche ist die ganze Zeile statt eines 16-px-Griffs — der haeufigste Fehlgriff der Tests entfaellt
- **Positiv:** Touch wird erstmals unterstuetzt; die Reorder-Geste ist dieselbe wie in iOS/Android-Listen
- **Trade-off:** Die Haltedauer ist eine gelernte Geste. Sie steht deshalb im Onboarding-Hinweis (`hints.deck`), der per `?`-Button jederzeit wieder einzublenden ist
- **Trade-off:** Die Tastaturbedienung ist nicht mehr sichtbar, sondern nur per `aria-keyshortcuts` angekuendigt — schwaecher entdeckbar als zwei Buttons
- **Trade-off:** Gegenueber HTML5-DnD gibt es kein browsereigenes Drag-Bild. Die getragene Zeile wird stattdessen selbst angehoben (Schatten, Akzentrahmen) und per `translateY` dem Zeiger nachgefuehrt; waehrenddessen ist sie `pointer-events: none`, damit die Zeile darunter das Ziel bleibt
- **Risiko:** 180 ms ist gesetzt, nicht gemessen. Zu kurz laesst traege Klicks als Drag beginnen, zu lang laesst die Liste unbeweglich wirken — im Testprotokoll festzuhalten
