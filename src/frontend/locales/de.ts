import type { UiTranslation } from './en'
import howTo from './how-to/de'

const de: UiTranslation = {
  hints: {
    deck: 'Klicken Sie einen Grundsatz an, um ihn aufzuklappen: Bedeutung lesen und projektspezifische Interpretation ergänzen. Halten Sie eine Zeile gedrückt, um sie an eine beliebige Position zu ziehen — die Reihenfolge von oben nach unten ist Ihre Priorität. Nicht zutreffende Grundsätze legen Sie beiseite.',
  },
  deck: {
    title: 'Ihr Deck',
    empty: 'Keine Grundsätze geladen.',
    setAside: 'Als irrelevant beiseitelegen',
    setAsideSection: 'Beiseitegelegt',
    moveBack: 'Zurück ins Deck',
    countRelevant: '{{count}} relevant',
    countAside: '{{count}} beiseitegelegt',
    labelNotApplicable: 'nicht zutreffend',
  },
  card: {
    whatIsIncluded: 'Was ist enthalten?',
    inPractice: 'In der Praxis',
    yourInterpretation: 'Ihre Interpretation',
    editInterpretation: 'Interpretation bearbeiten',
    expandDetails: 'Details anzeigen',
    interpretationPlaceholder: 'Wie gilt „{{name}}" für Ihren Anwendungsfall?',
    done: 'Fertig',
    dragToReorder: 'Gedrückt halten zum Umsortieren',
    interpreted: 'interpretiert',
    notInterpreted: 'noch nicht interpretiert',
  },
  actions: {
    saving: 'Wird gespeichert…',
    saved: 'Gespeichert',
    showHint: 'Hinweis anzeigen',
    loading: 'Lädt…',
  },
  howTo,
}

export default de
