# ADR-012: How-To-Seite und minimales Client-Routing

**Status:** Accepted
**Datum:** 2026-10-14
**Ersetzt:** Routing-Teil von [ADR-005](005-fontsource-dsgvo-react-router.md)

## Kontext

Die App erklaert sich bisher mit einem einzigen Satz: `hints.deck` beschreibt die Halte-Geste der Deck-Liste. Was die neun Grundsaetze ueberhaupt sind, wie eine Interpretation entsteht, was die Reihenfolge bedeutet und was nach dem Workshop mit beidem passiert, steht nirgends. Teilnehmer:innen eines Workshops muessen das derzeit moderiert bekommen.

Zwei Dinge erschweren eine Erklaerseite:

1. **Es gibt keinen Router.** `react-router` steht weder in der `package.json` noch im Lockfile; `App.tsx` rendert direkt `PrinciplesManagement`. ADR-005 erklaerte React Router v7 mit den Routen `/`, `/principles` und `/principles/:id` als Accepted — umgesetzt wurde das nie. Die dort vorgesehene Route `/principles` ist ausserdem **nicht umsetzbar**: `src/frontend/vite.config.ts` proxied `/principles` (ebenso `/api`, `/trpc`, `/health`, `/webhooks`) im Dev-Server ans Backend. Eine Client-Route unter einem dieser Prefixe ist in der Entwicklung unerreichbar.
2. **Es gibt keine Sprachauswahl.** Die Locale wird in `src/frontend/lib/i18n.ts` aus `localStorage('locale')` oder `navigator.language` gelesen und nie geschrieben. Eine Seite in vier Sprachen waere ohne einen Weg, die Sprache zu waehlen, nur in der Browsersprache sichtbar.

## Entscheidung

### 1. Minimales History-API-Routing statt react-router

`src/frontend/lib/useRoute.ts` haelt genau zwei Routen: `/` → Deck, `/how-to` → How-To-Seite. Unbekannte Pfade fallen auf das Deck zurueck; die App hat keine 404-Ansicht.

Deep-Linking ist die einzige Anforderung, die reinen Komponenten-State ausschliesst — die Moderation verschickt den Link waehrend der Session. Zwei statische Pfade brauchen dafuer `history.pushState` und einen `popstate`-Listener, rund 30 Zeilen. Der Matcher, die Data-APIs und die Bundle-Groesse von React Router v7 liefern dafuer keinen Gegenwert. Das folgt demselben Muster wie ADR-010 (`@primer/react` abgelehnt) und ADR-011 (HTML5-DnD durch eigene Pointer-Events ersetzt).

Der Production-Fallback existiert bereits: `src/index.ts` antwortet im Production-Modus auf jedes `GET` mit `index.html`. Keine Serveraenderung.

Navigiert wird ueber echte `<a href>` mit abgefangenem Klick, nicht ueber Buttons — der Link wird in der Session kopiert und weitergegeben, die URL muss also im Kontextmenue stehen. Die Query-String bleibt beim Navigieren erhalten, damit `?lang=` ueberlebt.

### 2. Kein App-Shell — Einstieg im Box-Header des Decks

ADR-010 hat die GitHub-App-Shell bewusst nicht gebaut. Der How-To-Link kommt deshalb ohne neue Layout-Ebene: `ProjectDeck` nimmt bereits `headerAction`, dort stehen jetzt `HowToLink` (`BookOpen`) und der bestehende `HelpButton` nebeneinander. Die How-To-Seite traegt einen `ArrowLeft`-Backlink.

Der Link steht **nicht** im `hints.deck`-Text: das waere ein `<Trans>`-Umbau von vier bereits geschriebenen Saetzen fuer eine Affordanz, die der Header-Link abdeckt.

### 3. Eine dichte Seite, nach Diátaxis getrennte Zonen

Die Seite ist ein Nachschlagewerk fuer den laufenden Workshop, kein Kurs. Sie haelt kein `localStorage`, keinen Fortschritt, keinen Wizard und keine Animation.

Reihenfolge: Vokabular (Grundsatz, Interpretation, Position, Beiseitelegen) → die neun Grundsaetze als Referenz → Interpretation schreiben → Bedeutung der Reihenfolge → Integration → ein zugeklapptes „Warum so". Jeder Abschnitt tragt ein sichtbares Zonen-Badge (Anleitung / Nachschlagen / Hintergrund), damit Anleitung und Referenz nicht verschwimmen — der Fehlermodus, den Diátaxis fuer genau solche Inhalte beschreibt.

Zwei inhaltliche Festlegungen:

- **Die Reihenfolge bedeutet Betroffenheit des Projekts**, nicht moralischen Rang und nicht Vorrang bei Zielkonflikten. Das steht explizit auf der Seite. Hintergrund: Es ist empirisch dokumentiert, dass Praktiker:innen die Uebersetzung qualitativer ethischer Urteile in starre Zahlenwerte zurueckweisen. Die Lesart „Betroffenheit" entschaerft das, muss aber ausgesprochen werden, sonst stellt sich die Frage im Raum.
- **Die Integration wird konzeptuell beschrieben**, ohne GitLab, Labels oder Webhooks. Das haelt die Seite robust gegen Aenderungen am Integrationspfad. Preis: Wer nach dem Workshop selbst ein Work Item verknuepfen will, findet auf der Seite nicht, wie.

Ausdruecklich nicht dargestellt werden **Grid, Fragekarten, Klebepunkt-Legende und Magic Estimation**. Diese App ist eine bewusst vereinfachte Variante der Methode; digital bindet nichts an ein physisches Grid. Weil Teilnehmer:innen, die das gedruckte Set kennen, genau das suchen werden, benennt der aufklappbare Abschnitt die Auslassung statt sie zu verschweigen.

### 4. Texte im typisierten i18next-Dictionary, aufgeteilt nach `locales/how-to/*`

Die Kopie liegt in `src/frontend/locales/how-to/{en,de,fr,it}.ts` und wird in die vier Haupt-Dictionaries als `howTo` eingehaengt. Der Vertrag `UiTranslation = typeof en` erzwingt damit weiterhin alle vier Sprachen: `tsc --noEmit` schlaegt fehl, solange eine fehlt.

**MDX wurde abgelehnt**: Per-Locale-MDX-Dateien weichen vom typisierten Dictionary-Modell ab, lassen sich nicht ueber i18next-Keys ansprechen und erfordern Plugin-Verdrahtung in Vite 8 (Rolldown) *und* in der Vitest-Konfiguration.

**Ein eigener, lazy geladener Namespace wurde abgelehnt**: Resource-Splitting, Suspense und eine Aenderung an `test-setup.ts` fuer rund 4 kB.

**Prinzipientexte werden nie kopiert.** Name, Keywords, `practice` und die Kategorieueberschriften kommen ueber `resolvePrincipleContent` aus `src/locales/` und sind dort bereits in allen vier Sprachen gepflegt (ADR-009). Das halbiert den Uebersetzungsaufwand der Seite. Listen liegen als Objekte mit festen Keys vor, nicht als Arrays — `typeof en` typisiert ein Array als `string[]`, ein fehlender Eintrag waere sonst kein Typfehler.

### 5. `?lang=` wirkt nur auf dieser Seite, nicht global

`HowToPage` liest `?lang=`, validiert gegen die vorhandenen Locales und rendert mit `i18n.getFixedT(lang)` sowie `resolvePrincipleContent(id, lang)`. Nichts wird persistiert, die globale i18next-Sprache bleibt unberuehrt. Der Seitencontainer traegt `lang={locale}`.

Das ist die folgenreichste Entscheidung dieses ADR, und sie ist keine Stilfrage: Das Frontend sendet die aktive Locale an `deck.rankPrinciples`; von dort geht sie an `DeckWorkItemSyncService`, und `ensureLabels` legt die Work-Item-Labels **mit den Prinzipiennamen in dieser Sprache** an. Ein globaler Sprachwechsel erzeugt also einen zweiten Labelsatz, waehrend der erste verwaist. Ein sichtbarer Language-Switcher ist damit kein UI-Feature, sondern ein Datenproblem — und bleibt bis zu dessen Loesung draussen.

### 6. Provenienz der FR/IT-Texte

Deutsch ist zuerst geschrieben (das Cookbook ist deutsch, das formale „Sie" war in `locales/de.ts` gesetzt), Englisch ist die Typquelle. **FR und IT sind maschinell uebersetzt und tragen einen `TODO i18n-review`-Kopf.** Sie muessen vor dem ersten frankophonen bzw. italophonen Workshop von einer namentlich benannten Person gelesen werden. Das steht hier, damit die Herkunft dokumentiert ist und nicht implizit bleibt.

Register je Sprache wie im Bestand: DE „Sie", FR „vous", IT „tu", EN „you".

## Konsequenzen

- **Positiv:** Die Methode ist erstmals ohne Moderation erklaert, unter einer teilbaren URL.
- **Positiv:** Keine neue Runtime-Abhaengigkeit; der Seiteninhalt haengt nicht am Backend und bleibt lesbar, wenn tRPC mitten in der Session ausfaellt.
- **Positiv:** Die Halte-Geste und die Alt-Pfeil-Tastenbedienung sind jetzt sichtbar dokumentiert — ADR-011 hielt beide als Schwachstelle fest (gelernte Geste; Tastatur nur per `aria-keyshortcuts` angekuendigt).
- **Positiv:** `?lang=` macht die vorhandenen vier Sprachen erstmals erreichbar, ohne die Label-Sprache zu beruehren.
- **Trade-off:** Zwei Routen ohne Router heisst: Jede dritte Route kostet eine bewusste Erweiterung von `useRoute`. Ab etwa vier Routen oder dem ersten Pfadparameter ist react-router die richtige Antwort.
- **Trade-off:** Die Gestenbeschreibungen in `howTo.priority.mechanics` sind eine Kopie der Semantik aus `useLongPressReorder` und `hints.deck`. Eine technische Kopplung ist ohne Zerschneiden der Saetze nicht moeglich; wer die Geste aendert, muss die Seite mitaendern.
- **Trade-off:** Die konzeptuelle Integrationsbeschreibung macht nicht handlungsfaehig.
- **Risiko:** Die Seite sagt nichts darueber, wer im Team entscheidet und wie ein Dissens aufgeloest wird. Dieses Schweigen ist in der Toolkit-Forschung als dominanter Fehlermodus beschrieben (Wong et al., 27 AI-Ethics-Toolkits). Hier eine bewusste Auslassung, weil nur Qualitaetsmerkmale und ein Beispiel gewuenscht waren, aber im Testprotokoll festzuhalten, ob Teilnehmende danach fragen.
- **Risiko:** `src/index.ts` antwortet in Production auf *jedes* `GET` mit `index.html` und ist per `app.use` registriert. Das Deep-Linking von `/how-to` haengt an genau diesem Fallback, aber damit koennten auch `GET /health` und die REST-Endpunkte verdeckt sein. Vor einem Production-Deploy mit `curl` pruefen; wenn der Fallback eingeengt werden muss, die geproxyten Prefixe ausnehmen statt Client-Routen zu erlauben. Bestehendes Verhalten, von dieser Aenderung nur genutzt.
