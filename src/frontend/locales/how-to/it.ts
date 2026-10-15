import type { HowToTranslation } from './en'

/**
 * TODO i18n-review — traduzione da rivedere da una persona italofona.
 * Registro «tu», come il resto del testo italiano (vedi `locales/it.ts`).
 * I termini seguono l'interfaccia: deck, principio, interpretazione, mettere da parte.
 */
const howTo: HowToTranslation = {
  linkLabel: 'Come funziona',
  title: 'Come funziona DARE qui',
  lead: 'Nove principi etici, la tua lettura di ciascuno, ordinati in base a quanto il tuo progetto ne è toccato. Tieni questa pagina aperta durante la sessione.',
  backToDeck: 'Torna al deck',

  zone: {
    howto: 'Istruzioni',
    reference: 'Riferimento',
    explanation: 'Contesto',
  },

  jump: {
    principles: 'I nove principi',
    interpretation: 'Scrivere un’interpretazione',
    priority: 'L’ordine',
    integration: 'Nel tuo lavoro',
  },

  vocabulary: {
    title: 'Prima quattro parole',
    terms: {
      principle: {
        term: 'Principio',
        def: 'Uno dei nove principi etici dati. Sono fissi — non se ne possono aggiungere, rinominare o eliminare.',
      },
      interpretation: {
        term: 'Interpretazione',
        def: 'Che cosa significa concretamente un principio in questo progetto: il testo che scrive il tuo team. Il principio è dato, l’interpretazione è tua.',
      },
      position: {
        term: 'Posizione nel deck',
        def: 'Quanto il tuo progetto è toccato da quel principio. In alto significa: toccato di più.',
      },
      setAside: {
        term: 'Mettere da parte',
        def: 'Questo principio non si applica al tuo progetto. Resta visibile sotto il deck, quindi la decisione rimane reversibile.',
      },
    },
  },

  principles: {
    title: 'A cosa servono i principi',
    lead: 'I nove principi sono un vocabolario comune per parlare di ciò che il tuo software fa alle persone — utile proprio perché nessuno nel team deve essere un eticista per usarli. Sono volutamente astratti; per questo ognuno ha bisogno della tua interpretazione prima di dire qualcosa sul tuo progetto.',
  },

  interpretation: {
    title: 'Scrivere un’interpretazione',
    lead: 'Una buona interpretazione è quella su cui una persona appena entrata nel team può agire senza chiederti cosa intendevi.',
    criteriaTitle: 'Cosa la rende buona',
    criteria: {
      c1: 'Concreta anziché generica — nomina la funzionalità o i dati, non il valore.',
      c2: 'Nomina chi è coinvolto.',
      c3: 'Nomina una conseguenza che qualcuno può verificare.',
      c4: 'Scritta nella lingua del tuo team, non in gergo etico.',
      c5: 'Una formulazione condivisa su cui il team si accorda, non l’opinione di una persona.',
    },
    examplePrinciple: 'Un esempio su Privacy',
    weakLabel: 'Debole',
    weak: 'Teniamo alla protezione dei dati.',
    weakWhy: 'Vale per qualsiasi progetto, quindi non cambia nulla. Nessuno può ricavarne un’azione e nessuno può verificarlo.',
    goodLabel: 'Buona',
    good: 'I pazienti vedono quale studio ha aperto la loro cartella, e nessuna esportazione contiene un nome di cui il referto non ha bisogno.',
    goodWhy: 'Nomina il gruppo coinvolto, la funzionalità concreta e due cose verificabili in revisione.',
  },

  priority: {
    title: 'Cosa significa l’ordine',
    meaning: 'La posizione dice quanto il tuo progetto è toccato da un principio. Quello in alto è dove guardi per primo: lì il tuo software ha la portata maggiore.',
    notMeaning: 'Non è una classifica morale e non decide quale principio vince quando due entrano in conflitto. Un principio in fondo non è meno importante — il tuo progetto lo tocca semplicemente meno.',
    mechanicsTitle: 'Lavorare con il deck',
    mechanics: {
      position: 'La posizione è la priorità. Non c’è nulla da inviare.',
      expand: 'Un clic breve apre una riga: cosa copre il principio e la tua interpretazione.',
      drag: 'Tieni premuta brevemente una riga, poi spostala — si posiziona dove rilasci.',
      keyboard: 'Senza mouse: porta il focus su una riga, poi usa Alt insieme alle frecce.',
      setAside: 'Mettere da parte un principio sposta tutte le posizioni sottostanti.',
      autosave: 'Interpretazioni e ordine vengono salvati da sé, poco dopo ogni modifica.',
    },
  },

  integration: {
    title: 'Come arriva nel tuo lavoro',
    lead: 'Il senso del deck non è il deck. Le tue interpretazioni e il tuo ordine non restano in un verbale di workshop — l’app li porta sugli elementi di lavoro che i principi toccano davvero.',
    steps: {
      s1: 'Qui interpreti e ordini i principi.',
      s2: 'L’app porta entrambi nel tuo processo di lavoro.',
      s3: 'La tua interpretazione è lì mentre costruisci ciò di cui parla.',
    },
  },

  why: {
    trigger: 'Perché la pagina è fatta così',
    method: 'DARE — Deliberative, Agile and Responsive Ethics — è un metodo per portare le questioni etiche nello sviluppo agile senza che nessuno debba prima studiare etica. La sua ipotesi di lavoro: un team che ha messo un principio in parole proprie lo riconosce quando il suo lavoro ci va a sbattere.',
    simplified: 'Questa app è una versione volutamente semplificata. Il set stampato comprende anche una griglia, tre mazzi di carte-domanda e un gioco di stima sulla serie di Fibonacci. In digitale nulla è legato a una griglia fisica; qui resta quindi la parte che si trasferisce: i principi, la tua interpretazione di essi e l’ordine.',
    lineage: 'Il metodo è descritto in:',
  },
}

export default howTo
