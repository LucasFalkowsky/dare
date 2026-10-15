import { resolvePrincipleContent, LocaleCode } from '../../locales';

/**
 * The DARE principle vocabulary, shared by every service that has to translate
 * between principle ids and the names a work item carries on the platform
 * (GitLab labels, GitHub issue-field options).
 */
export const ALL_PRINCIPLE_IDS = [
  'P001_beneficence',
  'P002_sustainability',
  'P003_non-Maleficence',
  'P004_dignity',
  'P005_autonomy',
  'P006_transparency',
  'P007_privacy',
  'P008_justice',
  'P009_solidarity',
];

const ALL_LOCALES: LocaleCode[] = ['en', 'de', 'fr', 'it'];

/** Principle names for one locale, in the order of ALL_PRINCIPLE_IDS. */
export function principleLabelNames(locale: LocaleCode = 'en'): string[] {
  const names: string[] = [];
  for (const id of ALL_PRINCIPLE_IDS) {
    const name = resolvePrincipleContent(id, locale).name;
    if (name) names.push(name);
  }
  return names;
}

/** Every principle name across every locale, de-duplicated. */
export function allPrincipleLabelNames(): string[] {
  const names = new Set<string>();
  for (const id of ALL_PRINCIPLE_IDS) {
    for (const locale of ALL_LOCALES) {
      const name = resolvePrincipleContent(id, locale).name;
      if (name) names.add(name);
    }
  }
  return [...names];
}

function buildLabelToPrincipleMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const principleId of ALL_PRINCIPLE_IDS) {
    for (const locale of ALL_LOCALES) {
      const name = resolvePrincipleContent(principleId, locale).name;
      if (name) map[name.toLowerCase()] = principleId;
    }
  }
  return map;
}

const LABEL_TO_PRINCIPLE = buildLabelToPrincipleMap();

/** The principle a label/option name stands for, in any supported locale. */
export function principleIdForLabel(name: string): string | undefined {
  return LABEL_TO_PRINCIPLE[name.toLowerCase()];
}

/**
 * Whether a label/option name belongs to the DARE vocabulary. Work items carry
 * foreign labels too ('bug', 'wontfix'); only principles may be inherited.
 */
function isPrincipleLabel(name: string): boolean {
  return principleIdForLabel(name) !== undefined;
}

/** Keeps only the principle names from a platform's raw label/option list. */
export function filterPrincipleLabels(names: string[]): string[] {
  return names.filter(isPrincipleLabel);
}
