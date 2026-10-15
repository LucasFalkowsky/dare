import type { HowToTranslation } from './en'

/**
 * Siezend, wie der restliche deutsche UI-Text (siehe `locales/de.ts`).
 * Die Begriffe folgen bewusst der Oberfläche — Deck, Grundsatz,
 * Interpretation, beiseitelegen —, damit die Seite neben der App gelesen
 * werden kann und nicht gegen sie.
 */
const howTo: HowToTranslation = {
  linkLabel: 'So funktioniert es',
  title: 'So funktioniert DARE hier',
  lead: 'Neun ethische Grundsätze, Ihre eigene Lesart jedes einzelnen, geordnet danach, wie stark Ihr Projekt betroffen ist. Lassen Sie diese Seite während der Session offen.',
  backToDeck: 'Zurück zum Deck',

  zone: {
    howto: 'Anleitung',
    reference: 'Nachschlagen',
    explanation: 'Hintergrund',
  },

  jump: {
    principles: 'Die neun Grundsätze',
    interpretation: 'Eine Interpretation schreiben',
    priority: 'Die Reihenfolge',
    integration: 'In Ihrer Arbeit',
  },

  vocabulary: {
    title: 'Zuerst vier Begriffe',
    terms: {
      principle: {
        term: 'Grundsatz (DARE-Prinzip)',
        def: 'Einer von neun vorgegebenen ethischen Grundsätzen. Sie sind gesetzt — hinzufügen, umbenennen oder löschen lässt sich keiner.',
      },
      interpretation: {
        term: 'Interpretation (Auslegung)',
        def: 'Was ein Grundsatz in diesem Projekt konkret bedeutet: der Text, den Ihr Team schreibt. Der Grundsatz ist vorgegeben, die Interpretation ist Ihre.',
      },
      position: {
        term: 'Position im Deck',
        def: 'Wie stark Ihr Projekt von diesem Grundsatz betroffen ist. Oben heißt: am stärksten betroffen.',
      },
      setAside: {
        term: 'Beiseitelegen',
        def: 'Dieser Grundsatz trifft auf Ihr Projekt nicht zu. Er bleibt unterhalb des Decks sichtbar, die Entscheidung bleibt also umkehrbar.',
      },
    },
  },

  principles: {
    title: 'Wozu die Grundsätze da sind',
    lead: 'Die neun Grundsätze sind ein gemeinsamer Wortschatz, um darüber zu sprechen, was Ihre Software mit Menschen macht — brauchbar gerade deshalb, weil niemand im Team Ethiker sein muss, um sie zu benutzen. Sie sind absichtlich abstrakt; deshalb braucht jeder von ihnen Ihre Interpretation, bevor er etwas über Ihr Projekt aussagt.',
  },

  interpretation: {
    title: 'Eine Interpretation schreiben',
    lead: 'Eine gute Interpretation ist eine, mit der ein neues Teammitglied arbeiten kann, ohne nachzufragen, was gemeint war.',
    criteriaTitle: 'Was eine gute ausmacht',
    criteria: {
      c1: 'Konkret statt allgemein — benennen Sie die Funktion oder die Daten, nicht den Wert.',
      c2: 'Benennt, wer betroffen ist.',
      c3: 'Benennt eine Folge, die jemand überprüfen kann.',
      c4: 'In der Sprache Ihres Teams geschrieben, nicht in Ethik-Jargon.',
      c5: 'Eine gemeinsame Formulierung, auf die sich das Team einigt — nicht die Meinung einer Person.',
    },
    examplePrinciple: 'Ein Beispiel an Privatheit',
    weakLabel: 'Schwach',
    weak: 'Wir achten auf Datenschutz.',
    weakWhy: 'Gilt für jedes Projekt und ändert deshalb nichts. Niemand kann daraus etwas ableiten, und niemand kann es überprüfen.',
    goodLabel: 'Gut',
    good: 'Patient:innen sehen, welche Praxis ihre Akte geöffnet hat, und kein Export enthält einen Namen, den der Bericht nicht braucht.',
    goodWhy: 'Benennt die betroffene Gruppe, die konkrete Funktion und zwei Dinge, die im Review prüfbar sind.',
  },

  priority: {
    title: 'Was die Reihenfolge bedeutet',
    meaning: 'Die Position sagt, wie stark Ihr Projekt von einem Grundsatz betroffen ist. Was oben steht, sehen Sie sich zuerst an — dort hat Ihre Software die größte Reichweite.',
    notMeaning: 'Es ist keine moralische Rangordnung, und es entscheidet nicht, welcher Grundsatz gewinnt, wenn zwei kollidieren. Ein Grundsatz weit unten ist nicht weniger wichtig — Ihr Projekt berührt ihn nur weniger.',
    mechanicsTitle: 'Mit dem Deck arbeiten',
    mechanics: {
      position: 'Die Position ist die Priorität. Es gibt nichts abzuschicken.',
      expand: 'Ein kurzer Klick öffnet eine Zeile: was der Grundsatz umfasst, und Ihre Interpretation.',
      drag: 'Halten Sie eine Zeile kurz gedrückt und bewegen Sie sie — sie landet dort, wo Sie loslassen.',
      keyboard: 'Ohne Maus: Zeile fokussieren, dann Alt zusammen mit den Pfeiltasten.',
      setAside: 'Einen Grundsatz beiseitezulegen verschiebt alle Positionen darunter.',
      autosave: 'Interpretationen und Reihenfolge werden von selbst gespeichert, kurz nach jeder Änderung.',
    },
  },

  integration: {
    title: 'Wie das in Ihrer Arbeit ankommt',
    lead: 'Der Sinn des Decks ist nicht das Deck. Ihre Interpretationen und Ihre Reihenfolge bleiben nicht in einem Workshop-Dokument liegen — die App trägt sie an die Arbeitspakete, die die Grundsätze tatsächlich berühren.',
    steps: {
      s1: 'Hier interpretieren und ordnen Sie die Grundsätze.',
      s2: 'Die App trägt beides in Ihren Arbeitsprozess.',
      s3: 'Ihre eigene Interpretation steht da, während Sie das bauen, worum es in ihr geht.',
    },
  },

  why: {
    trigger: 'Warum die Seite so aussieht',
    method: 'DARE — Deliberative, Agile and Responsive Ethics — ist eine Methode, um ethische Fragen in die agile Entwicklung zu holen, ohne dass vorher jemand Ethik lernen muss. Ihre Arbeitsannahme: Ein Team, das einen Grundsatz in eigene Worte gefasst hat, erkennt wieder, wenn seine Arbeit darauf stößt.',
    simplified: 'Diese App ist eine bewusst vereinfachte Variante. Zum gedruckten Set gehören außerdem ein Grid, drei Sätze Fragekarten und ein Schätzspiel auf der Fibonacci-Reihe. Digital ist nichts an ein physisches Grid gebunden; übrig bleibt hier deshalb der Teil, der sich überträgt: die Grundsätze, Ihre Interpretation davon und die Reihenfolge.',
    lineage: 'Die Methode ist beschrieben in:',
  },
}

export default howTo
