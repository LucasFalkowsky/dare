export type PrincipleLocaleEntry = {
    name: string;
    keywords: string;
    practice: string;
    category: string;
};

const it: Record<string, PrincipleLocaleEntry> = {
    P001: {
        name: 'Beneficenza',
        keywords: 'Benessere, utilità, benessere, pace, bene sociale, bene comune, cura',
        practice: 'Come "sorella maggiore" del principio di non maleficenza, il principio di beneficenza si interroga sugli effetti positivi.',
        category: 'Beneficenza',
    },
    P002: {
        name: 'Sostenibilità',
        keywords: 'Sostenibilità, influenze ambientali, risorse, energia',
        practice: 'Se ospitate i vostri dati nel cloud di un fornitore terzo, dovreste informarvi sulla sostenibilità del servizio di tale fornitore. Se utilizzate hardware, elaborate i dati sui vostri stessi dispositivi fisici o nel cloud?',
        category: 'Beneficenza',
    },
    P003: {
        name: 'Non maleficenza',
        keywords: 'Sicurezza, danno, protezione, prevenzione, integrità, non-sovversione',
        practice: 'Viene causato un danno alle persone, attivamente o per negligenza? La minimizzazione degli effetti negativi di una tecnologia è di grande importanza finanziaria per ogni organizzazione di sviluppo. Gli incidenti sono spesso costosi.',
        category: 'Beneficenza',
    },
    P004: {
        name: 'Dignità',
        keywords: 'Dignità umana, libertà',
        practice: 'La tecnologia, in particolare l’intelligenza artificiale e gli algoritmi, può essere carica di pregiudizi e quindi portare a distorsioni.',
        category: 'Dignità',
    },
    P005: {
        name: 'Autonomia',
        keywords: 'Libertà, consenso, libertà di scelta, autodeterminazione, empowerment, competenze, cura',
        practice: "Qui si tratta, tra l'altro, di capire se la libertà decisionale e l'autodeterminazione degli utenti vengono limitate o rafforzate dalla tecnologia.",
        category: 'Dignità',
    },
    P006: {
        name: 'Trasparenza',
        keywords: 'Spiegabilità, comprensibilità, traducibilità, comunicazione, divulgazione',
        practice: 'In materia di trasparenza, è importante capire nei confronti di chi si è trasparenti e in che modo. La trasparenza può rendere la tecnologia più comprensibile, ma anche aiutare nella risoluzione dei problemi.',
        category: 'Dignità',
    },
    P007: {
        name: 'Privacy',
        keywords: 'Dati personali, privacy, riservatezza',
        practice: 'Garantire la privacy può essere anche un argomento di vendita. Inoltre, le normative vigenti (ad es. il GDPR) rendono sempre più complicato raccogliere grandi quantità di dati personali per trarne profitto.',
        category: 'Dignità',
    },
    P008: {
        name: 'Giustizia',
        keywords: 'Equità, coerenza, inclusione, uguaglianza, accessibilità, non discriminazione, diversità, pluralità, reversibilità, risarcimento, riparazione, accesso, distribuzione, distorsioni, partecipazione',
        practice: 'La giustizia esiste in molte dimensioni. Può anche descrivere uno stato della società.',
        category: 'Giustizia',
    },
    P009: {
        name: 'Solidarietà',
        keywords: 'Solidarietà, giustizia sociale, coesione',
        practice: "L’intelligenza artificiale (IA) tende a favorire in particolare coloro che sono familiari con i sistemi tecnici. Di conseguenza, ciò può portare a crescenti disuguaglianze all'interno della società (alfabetizzazione digitale).",
        category: 'Giustizia',
    },
};

export default it;
