import type { UiTranslation } from './en'
import howTo from './how-to/fr'

const fr: UiTranslation = {
  hints: {
    deck: "Cliquez sur un principe pour le développer : lisez sa signification et ajoutez l'interprétation de votre projet. Maintenez une ligne enfoncée pour la glisser où vous voulez — l'ordre de haut en bas est votre priorité. Mettez de côté les principes qui ne s'appliquent pas.",
  },
  deck: {
    title: 'Votre Deck',
    empty: 'Aucun principe chargé.',
    setAside: 'Mettre de côté comme non pertinent',
    setAsideSection: 'Mis de côté',
    moveBack: 'Remettre dans le deck',
    countRelevant: '{{count}} pertinents',
    countAside: '{{count}} écartés',
    labelNotApplicable: 'non applicable',
  },
  card: {
    whatIsIncluded: "Qu'est-ce qui est inclus ?",
    inPractice: 'En pratique',
    yourInterpretation: 'Votre interprétation',
    editInterpretation: "Modifier l'interprétation",
    expandDetails: 'Afficher les détails',
    interpretationPlaceholder: "Comment « {{name}} » s'applique-t-il à votre cas d'usage ?",
    done: 'Terminé',
    dragToReorder: 'Maintenir pour réordonner',
    interpreted: 'interprété',
    notInterpreted: 'pas encore interprété',
  },
  actions: {
    saving: 'Enregistrement…',
    saved: 'Enregistré',
    showHint: "Afficher l'indice",
    loading: 'Chargement…',
  },
  howTo,
}

export default fr
