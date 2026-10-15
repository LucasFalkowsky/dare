export type PrincipleLocaleEntry = {
    name: string;
    keywords: string;
    practice: string;
    category: string;
};

const en: Record<string, PrincipleLocaleEntry> = {
    P001: {
        name: 'Beneficence',
        keywords: 'Welfare, benefit, well-being, peace, social good, common good, care',
        practice: 'As the "big sister" of the non-maleficence principle, the principle of beneficence focuses on positive effects.',
        category: 'Beneficence',
    },
    P002: {
        name: 'Sustainability',
        keywords: 'Sustainability, environmental impacts, resources, energy',
        practice: 'If you use a cloud service provided by a third-party company, you should inform yourself about the sustainability of the provider services. When hardware is used, how much energy is consumed by processing data in physical devices or in the cloud?',
        category: 'Beneficence',
    },
    P003: {
        name: 'Non-Maleficence',
        keywords: 'Safety, harm, protection, prevention, integrity, non-subversion',
        practice: 'Are people actively or indirectly harmed through carelessness? Minimizing negative effects and avoiding financial losses are important. Incidents can be costly.',
        category: 'Beneficence',
    },
    P004: {
        name: 'Dignity',
        keywords: 'Human dignity, freedom',
        practice: 'Technology, especially artificial intelligence and algorithms, can be affected by prejudices and therefore lead to distortions caused by technology.',
        category: 'Dignity',
    },
    P005: {
        name: 'Autonomy',
        keywords: 'Freedom, consent, freedom of choice, self-determination, empowerment, capabilities, care',
        practice: 'This includes ensuring that users are not restricted in their decision-making and self-determination through the use of technology.',
        category: 'Dignity',
    },
    P006: {
        name: 'Transparency',
        keywords: 'Explainability, comprehensibility, traceability, communication, disclosure',
        practice: 'The topic of transparency is important to understand how transparent systems are and what insights can be gained. Transparency can make technology more understandable, but it can also be helpful when analyzing errors.',
        category: 'Dignity',
    },
    P007: {
        name: 'Privacy',
        keywords: 'Personal data, personal privacy, privacy',
        practice: 'Protecting privacy can also be a selling point. At the same time, complying with legal regulations such as GDPR can become more complex. Companies often collect large amounts of personal data in order to generate profit.',
        category: 'Dignity',
    },
    P008: {
        name: 'Justice',
        keywords: 'Fairness, consistency, inclusion, equality, diversity, non-discrimination, plurality, reversibility, accountability, compensation, restoration, access, distribution, distortion, participation',
        practice: 'Justice has many dimensions. It can also describe the condition of a society.',
        category: 'Justice',
    },
    P009: {
        name: 'Solidarity',
        keywords: 'Solidarity, social justice, cohesion',
        practice: 'Artificial intelligence tends to benefit those who are already familiar with technical systems. As a result, it can lead to growing inequalities within society, such as the digital literacy divide.',
        category: 'Justice',
    },
};

export default en;
