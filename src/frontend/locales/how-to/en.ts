/**
 * Copy for the How-To page.
 *
 * Never copy principle text in here: name, keywords, practice and category
 * come from `src/locales/` via `resolvePrincipleContent` and are already
 * translated into every supported language (see ADR-009).
 *
 * The wording deliberately reuses the terms the deck itself shows — deck,
 * principle, interpretation, set aside — so the page reads next to the UI
 * rather than beside it. Keep the gesture descriptions in `priority.mechanics`
 * in sync with `hints.deck` and `card.dragToReorder`.
 */
const howTo = {
  linkLabel: 'How it works',
  title: 'How DARE works here',
  lead: 'Nine ethical principles, your own reading of each one, ordered by how much your project is affected. Keep this page open during the session.',
  backToDeck: 'Back to the deck',

  zone: {
    howto: 'How to',
    reference: 'Reference',
    explanation: 'Background',
  },

  jump: {
    principles: 'The nine principles',
    interpretation: 'Writing an interpretation',
    priority: 'The order',
    integration: 'In your work',
  },

  vocabulary: {
    title: 'Four words, first',
    terms: {
      principle: {
        term: 'Principle',
        def: 'One of nine given ethical principles. They are fixed — you cannot add, rename or delete them.',
      },
      interpretation: {
        term: 'Interpretation',
        def: 'What a principle concretely means in this project: the text your team writes. The principle is given, the interpretation is yours.',
      },
      position: {
        term: 'Position in the deck',
        def: 'How strongly your project is affected by that principle. Top means most affected.',
      },
      setAside: {
        term: 'Set aside',
        def: 'This principle does not apply to your project. It stays visible below the deck, so the decision remains reversible.',
      },
    },
  },

  principles: {
    title: 'What the principles are for',
    lead: 'The nine principles are a shared vocabulary for talking about what your software does to people — useful precisely because nobody on the team has to be an ethicist to use them. They are deliberately abstract, which is why each one needs your interpretation before it says anything about your project.',
  },

  interpretation: {
    title: 'Writing an interpretation',
    lead: 'A good interpretation is one a new team member could act on without asking you what you meant.',
    criteriaTitle: 'What makes one good',
    criteria: {
      c1: 'Concrete instead of general — name the feature or the data, not the value.',
      c2: 'Names who is affected.',
      c3: 'Names a consequence someone could check.',
      c4: 'Written in your team’s language, not in ethics jargon.',
      c5: 'One shared wording the team agrees on, not one person’s opinion.',
    },
    examplePrinciple: 'An example on Privacy',
    weakLabel: 'Weak',
    weak: 'We care about privacy.',
    weakWhy: 'True of every project, so it changes nothing. Nobody can act on it and nobody can check it.',
    goodLabel: 'Good',
    good: 'Patients can see which practice has opened their file, and no export carries a name the report does not need.',
    goodWhy: 'Names the affected group, the concrete feature, and two things a reviewer can check.',
  },

  priority: {
    title: 'What the order means',
    meaning: 'The position says how strongly your project is affected by a principle. Whatever sits at the top is where you look first, because that is where your software has the most reach.',
    notMeaning: 'It is not a moral ranking, and it does not decide which principle wins when two of them collide. A principle far down the deck is not less important — your project simply touches it less.',
    mechanicsTitle: 'Working the deck',
    mechanics: {
      position: 'The position is the priority. There is nothing to submit.',
      expand: 'A short click opens a row: what the principle covers, and your interpretation.',
      drag: 'Press and hold a row briefly, then move it — it lands where you let go.',
      keyboard: 'Without a mouse: focus a row, then use Alt together with the arrow keys.',
      setAside: 'Setting a principle aside shifts every position below it.',
      autosave: 'Interpretations and order are saved on their own, shortly after each change.',
    },
  },

  integration: {
    title: 'How this reaches your work',
    lead: 'The point of the deck is not the deck. Your interpretations and your order do not stay in a workshop document — the app carries them into the work items the principles actually touch.',
    steps: {
      s1: 'You interpret and order the principles here.',
      s2: 'The app carries both into your work process.',
      s3: 'Your own interpretation is there while you build the thing it is about.',
    },
  },

  why: {
    trigger: 'Why the page looks like this',
    method: 'DARE — Deliberative, Agile and Responsive Ethics — is a method for bringing ethical questions into agile development without anyone needing ethics training first. Its working assumption: a team that has put its own words to a principle will recognise when its work runs into it.',
    simplified: 'This app is a deliberately simplified version. The printed set also comes with a canvas, three decks of question cards and an estimation game on a Fibonacci scale. Digital work is not bound to a physical canvas, so what remains here is the part that carries over: the principles, your interpretation of them, and the order.',
    lineage: 'The method is described in:',
  },
}

export default howTo
export type HowToTranslation = typeof howTo
