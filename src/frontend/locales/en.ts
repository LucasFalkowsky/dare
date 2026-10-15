import howTo from './how-to/en'

const en = {
  hints: {
    deck: "Click a principle to expand it: read what it means and add your project's interpretation. Press and hold a row to drag it anywhere in the list — top to bottom is your priority ranking. Set aside the principles that don't apply.",
  },
  deck: {
    title: 'Your Deck',
    empty: 'No principles loaded.',
    setAside: 'Set aside as irrelevant',
    setAsideSection: 'Set aside',
    moveBack: 'Move back to deck',
    countRelevant: '{{count}} relevant',
    countAside: '{{count}} set aside',
    labelNotApplicable: 'not applicable',
  },
  card: {
    whatIsIncluded: 'What is included?',
    inPractice: 'In practice',
    yourInterpretation: 'Your interpretation',
    editInterpretation: 'Edit interpretation',
    expandDetails: 'Expand details',
    interpretationPlaceholder: 'How does "{{name}}" apply to your use case?',
    done: 'Done',
    dragToReorder: 'Press and hold to reorder',
    interpreted: 'interpreted',
    notInterpreted: 'not yet interpreted',
  },
  actions: {
    saving: 'Saving…',
    saved: 'Saved',
    showHint: 'Show hint',
    loading: 'Loading…',
  },
  howTo,
}

export default en
export type UiTranslation = typeof en
