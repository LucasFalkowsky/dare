export type PrincipleLocaleEntry = {
    name: string;
    keywords: string;
    practice: string;
    category: string;
};

const de: Record<string, PrincipleLocaleEntry> = {
    P001: {
        name: 'Wohltun',
        keywords: 'Wohlfahrt, Nutzen, Wohlbefinden, Frieden, soziales Gut, Gemeinwohl, Fürsorge',
        practice: 'Als "große Schwester" des Nicht-Schaden-Prinzips fragt das Prinzip des Wohltuns nach positiven Effekten.',
        category: 'Wohltun',
    },
    P002: {
        name: 'Nachhaltigkeit',
        keywords: 'Nachhaltigkeit, Umwelteinflüsse, Ressourcen, Energie',
        practice: 'Wenn Sie in einer Cloud eines Drittanbieters hosten, sollten Sie sich über die Nachhaltigkeit des Dienstes des Anbieters informieren. Wenn Sie Hardware verwenden, verarbeiten Sie die Daten in jedem Ihrer eigenen physischen Geräte oder in der Cloud?',
        category: 'Wohltun',
    },
    P003: {
        name: 'Nicht-Schaden',
        keywords: 'Sicherheit, Schaden, Schutz, Prävention, Integrität, Non-Subversion',
        practice: 'Werden Personen eventuell aktiv oder durch Nachlässigkeit ein Schaden zugefügt? Die Minimierung negativer Auswirkungen einer Technologie ist für jede Entwicklerorganisation von finanzieller Bedeutung. Vorfälle sind oft kostspielig.',
        category: 'Wohltun',
    },
    P004: {
        name: 'Würde',
        keywords: 'Menschenwürde, Freiheit',
        practice: 'Technik, insbesondere künstliche Intelligenz und Algorithmen, kann mit Vorurteilen belastet sein und so zu Verzerrungen führen.',
        category: 'Würde',
    },
    P005: {
        name: 'Autonomie',
        keywords: 'Freiheit, Zustimmung (Consent), Wahlfreiheit, Selbstbestimmung, Empowerment, Fähigkeiten, Fürsorge',
        practice: 'Hier geht es unter anderem darum, ob für Nutzer:innen in ihrer Entscheidungsfreiheit und Selbstbestimmung durch die Technologie eingeschränkt/gestärkt wird.',
        category: 'Würde',
    },
    P006: {
        name: 'Transparenz',
        keywords: 'Erklärbarkeit, Verständlichkeit, Übersetzbarkeit, Kommunikation, Offenlegung',
        practice: 'Beim Thema Transparenz ist es wichtig zu verstehen, wem gegenüber Sie transparent sind und in welcher Hinsicht. Transparenz kann Technik verständlicher machen, aber auch bei der Fehlersuche hilfreich sein.',
        category: 'Würde',
    },
    P007: {
        name: 'Datenschutz',
        keywords: 'personenbezogene Daten, Privatsphäre, Privatheit',
        practice: 'Das Gewähren von Privatsphäre kann auch ein Verkaufsargument sein. Zusätzlich machen es geltende Vorschriften (z.B. DSGVO) zunehmend komplizierter, personenbezogene Daten in großer Zahl zu sammeln, um damit Profit zu machen.',
        category: 'Würde',
    },
    P008: {
        name: 'Gerechtigkeit',
        keywords: 'Fairness, Konsistenz, Inklusion, Gleichheit, Zugänglichkeit, Nicht-Diskriminierung, Diversität, Pluralität, Reversibilität, Entschädigung, Wiedergutmachung, Zugang, Verteilung, Verzerrungen, Teilhabe',
        practice: 'Gerechtigkeit gibt es in vielen Dimensionen. Sie kann auch einen Zustand der Gesellschaft beschreiben.',
        category: 'Gerechtigkeit',
    },
    P009: {
        name: 'Solidarität',
        keywords: 'Solidarität, soziale Gerechtigkeit, Kohäsion',
        practice: 'Künstliche Intelligenz (KI) hat eine Tendenz, insbesondere denjenigen zu nutzen, die mit technischen Systemen vertraut sind. In der Folge kann das zu wachsenden Ungleichheiten innerhalb der Gesellschaft führen (e-literacy).',
        category: 'Gerechtigkeit',
    },
};

export default de;
