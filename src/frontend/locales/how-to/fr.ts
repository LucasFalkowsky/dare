import type { HowToTranslation } from './en'

/**
 * TODO i18n-review — traduction à relire par une personne francophone.
 * Registre « vous », comme le reste du texte français (voir `locales/fr.ts`).
 * Les termes suivent l'interface : deck, principe, interprétation, mettre de côté.
 */
const howTo: HowToTranslation = {
  linkLabel: 'Comment ça marche',
  title: 'Comment DARE fonctionne ici',
  lead: 'Neuf principes éthiques, votre propre lecture de chacun, classés selon le degré auquel votre projet est concerné. Gardez cette page ouverte pendant la session.',
  backToDeck: 'Retour au deck',

  zone: {
    howto: 'Mode d’emploi',
    reference: 'Référence',
    explanation: 'Contexte',
  },

  jump: {
    principles: 'Les neuf principes',
    interpretation: 'Rédiger une interprétation',
    priority: 'L’ordre',
    integration: 'Dans votre travail',
  },

  vocabulary: {
    title: 'D’abord quatre mots',
    terms: {
      principle: {
        term: 'Principe',
        def: 'L’un des neuf principes éthiques donnés. Ils sont fixes — impossible d’en ajouter, d’en renommer ou d’en supprimer.',
      },
      interpretation: {
        term: 'Interprétation',
        def: 'Ce qu’un principe signifie concrètement dans ce projet : le texte que votre équipe rédige. Le principe est donné, l’interprétation est la vôtre.',
      },
      position: {
        term: 'Position dans le deck',
        def: 'À quel point votre projet est concerné par ce principe. En haut signifie : le plus concerné.',
      },
      setAside: {
        term: 'Mettre de côté',
        def: 'Ce principe ne s’applique pas à votre projet. Il reste visible sous le deck, la décision reste donc réversible.',
      },
    },
  },

  principles: {
    title: 'À quoi servent les principes',
    lead: 'Les neuf principes forment un vocabulaire commun pour parler de ce que votre logiciel fait aux personnes — utile précisément parce que personne dans l’équipe n’a besoin d’être éthicien pour s’en servir. Ils sont volontairement abstraits ; c’est pourquoi chacun a besoin de votre interprétation avant de dire quoi que ce soit sur votre projet.',
  },

  interpretation: {
    title: 'Rédiger une interprétation',
    lead: 'Une bonne interprétation est celle sur laquelle une nouvelle personne dans l’équipe peut agir sans vous demander ce que vous vouliez dire.',
    criteriaTitle: 'Ce qui en fait une bonne',
    criteria: {
      c1: 'Concrète plutôt que générale — nommez la fonctionnalité ou les données, pas la valeur.',
      c2: 'Nomme qui est concerné.',
      c3: 'Nomme une conséquence que quelqu’un peut vérifier.',
      c4: 'Écrite dans la langue de votre équipe, pas en jargon éthique.',
      c5: 'Une formulation commune sur laquelle l’équipe s’accorde, pas l’avis d’une seule personne.',
    },
    examplePrinciple: 'Un exemple sur la vie privée',
    weakLabel: 'Faible',
    weak: 'Nous faisons attention à la protection des données.',
    weakWhy: 'Vrai pour tout projet, donc cela ne change rien. Personne ne peut en tirer une action, personne ne peut le vérifier.',
    goodLabel: 'Bonne',
    good: 'Les patients voient quel cabinet a ouvert leur dossier, et aucun export ne contient un nom dont le rapport n’a pas besoin.',
    goodWhy: 'Nomme le groupe concerné, la fonctionnalité concrète, et deux choses vérifiables en revue.',
  },

  priority: {
    title: 'Ce que signifie l’ordre',
    meaning: 'La position indique à quel point votre projet est concerné par un principe. Ce qui est en haut, vous le regardez en premier : c’est là que votre logiciel a la plus grande portée.',
    notMeaning: 'Ce n’est pas un classement moral, et cela ne décide pas quel principe l’emporte quand deux entrent en conflit. Un principe tout en bas n’est pas moins important — votre projet le touche simplement moins.',
    mechanicsTitle: 'Travailler avec le deck',
    mechanics: {
      position: 'La position est la priorité. Il n’y a rien à envoyer.',
      expand: 'Un clic bref ouvre une ligne : ce que couvre le principe, et votre interprétation.',
      drag: 'Maintenez brièvement une ligne enfoncée, puis déplacez-la — elle se place là où vous relâchez.',
      keyboard: 'Sans souris : placez le focus sur une ligne, puis utilisez Alt avec les touches fléchées.',
      setAside: 'Mettre un principe de côté décale toutes les positions en dessous.',
      autosave: 'Les interprétations et l’ordre sont enregistrés automatiquement, peu après chaque modification.',
    },
  },

  integration: {
    title: 'Comment cela arrive dans votre travail',
    lead: 'L’intérêt du deck n’est pas le deck. Vos interprétations et votre ordre ne restent pas dans un compte rendu d’atelier — l’application les porte jusqu’aux tickets que les principes concernent réellement.',
    steps: {
      s1: 'Ici, vous interprétez et ordonnez les principes.',
      s2: 'L’application porte les deux dans votre processus de travail.',
      s3: 'Votre propre interprétation est là pendant que vous construisez ce dont elle parle.',
    },
  },

  why: {
    trigger: 'Pourquoi la page ressemble à cela',
    method: 'DARE — Deliberative, Agile and Responsive Ethics — est une méthode pour faire entrer les questions éthiques dans le développement agile sans que personne ait besoin d’apprendre l’éthique d’abord. Son hypothèse de travail : une équipe qui a mis un principe dans ses propres mots le reconnaît quand son travail le rencontre.',
    simplified: 'Cette application est une version volontairement simplifiée. Le jeu imprimé comprend aussi une grille, trois jeux de cartes de questions et un jeu d’estimation sur la suite de Fibonacci. En numérique, rien n’est lié à une grille physique ; il reste donc ici la partie qui se transpose : les principes, votre interprétation de ceux-ci, et l’ordre.',
    lineage: 'La méthode est décrite dans :',
  },
}

export default howTo
