export type PrincipleLocaleEntry = {
    name: string;
    keywords: string;
    practice: string;
    category: string;
};

const fr: Record<string, PrincipleLocaleEntry> = {
    P001: {
        name: 'Bienfaisance',
        keywords: 'Bien-être, utilité, bien-être, paix, bien social, bien commun, sollicitude',
        practice: "En tant que « grande sœur » du principe de non-malfaisance, le principe de bienfaisance s'interroge sur les effets positifs.",
        category: 'Bienfaisance',
    },
    P002: {
        name: 'Durabilité',
        keywords: 'Durabilité, influences environnementales, ressources, énergie',
        practice: "Si vous hébergez vos données dans le cloud d'un fournisseur tiers, vous devriez vous informer sur la durabilité du service de ce fournisseur. Si vous utilisez du matériel, traitez-vous les données sur vos propres appareils physiques ou dans le cloud ?",
        category: 'Bienfaisance',
    },
    P003: {
        name: 'Non-malfaisance',
        keywords: 'Sécurité, préjudice, protection, prévention, intégrité, non-subversion',
        practice: "Un préjudice est-il causé aux personnes, que ce soit activement ou par négligence ? La minimisation des effets négatifs d'une technologie est d'une importance financière pour toute organisation de développement. Les incidents sont souvent coûteux.",
        category: 'Bienfaisance',
    },
    P004: {
        name: 'Dignité',
        keywords: 'Dignité humaine, liberté',
        practice: "La technologie, en particulier l'intelligence artificielle et les algorithmes, peut être chargée de préjugés et ainsi conduire à des distorsions.",
        category: 'Dignité',
    },
    P005: {
        name: 'Autonomie',
        keywords: 'Liberté, consentement, libre choix, autodétermination, autonomisation, compétences, sollicitude',
        practice: "Il s'agit ici, entre autres, de savoir si la liberté de décision et l'autodétermination des utilisateurs sont restreintes ou renforcées par la technologie.",
        category: 'Dignité',
    },
    P006: {
        name: 'Transparence',
        keywords: 'Explicabilité, intelligibilité, traductibilité, communication, divulgation',
        practice: 'En matière de transparence, il est important de comprendre envers qui vous êtes transparent et à quel égard. La transparence peut rendre la technologie plus compréhensible, mais aussi aider au dépannage.',
        category: 'Dignité',
    },
    P007: {
        name: 'Vie privée',
        keywords: 'Données personnelles, vie privée, intimité',
        practice: 'Garantir la vie privée peut aussi constituer un argument de vente. De plus, les réglementations en vigueur (par exemple le RGPD) rendent de plus en plus difficile la collecte de grandes quantités de données personnelles à des fins lucratives.',
        category: 'Dignité',
    },
    P008: {
        name: 'Justice',
        keywords: 'Équité, cohérence, inclusion, égalité, accessibilité, non-discrimination, diversité, pluralité, réversibilité, indemnisation, réparation, accès, répartition, distorsions, participation',
        practice: 'La justice existe dans de nombreuses dimensions. Elle peut aussi décrire un état de la société.',
        category: 'Justice',
    },
    P009: {
        name: 'Solidarité',
        keywords: 'Solidarité, justice sociale, cohésion',
        practice: 'L’intelligence artificielle (IA) a tendance  tend à profiter en particulier à ceux qui sont familiers avec les systèmes techniques. Cela peut entraîner une aggravation des inégalités au sein de la société (littératie numérique).',
        category: 'Justice',
    },
};

export default fr;
