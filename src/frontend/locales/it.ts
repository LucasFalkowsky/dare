import type { UiTranslation } from './en'
import howTo from './how-to/it'

const it: UiTranslation = {
  hints: {
    deck: "Clicca un principio per espanderlo: leggine il significato e aggiungi l'interpretazione del tuo progetto. Tieni premuta una riga per trascinarla dove vuoi — l'ordine dall'alto verso il basso è la tua priorità. Metti da parte i principi non applicabili.",
  },
  deck: {
    title: 'Il tuo Deck',
    empty: 'Nessun principio caricato.',
    setAside: 'Metti da parte come irrilevante',
    setAsideSection: 'Messi da parte',
    moveBack: 'Rimetti nel deck',
    countRelevant: '{{count}} rilevanti',
    countAside: '{{count}} messi da parte',
    labelNotApplicable: 'non applicabile',
  },
  card: {
    whatIsIncluded: 'Cosa è incluso?',
    inPractice: 'In pratica',
    yourInterpretation: 'La tua interpretazione',
    editInterpretation: 'Modifica interpretazione',
    expandDetails: 'Mostra dettagli',
    interpretationPlaceholder: 'Come si applica "{{name}}" al tuo caso d\'uso?',
    done: 'Fatto',
    dragToReorder: 'Tieni premuto per riordinare',
    interpreted: 'interpretato',
    notInterpreted: 'non ancora interpretato',
  },
  actions: {
    saving: 'Salvataggio…',
    saved: 'Salvato',
    showHint: 'Mostra suggerimento',
    loading: 'Caricamento…',
  },
  howTo,
}

export default it
