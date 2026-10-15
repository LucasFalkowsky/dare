import type { PrincipleLocaleEntry } from './en'
import de from './de'
import en from './en'
import fr from './fr'
import it from './it'

export type LocaleCode = 'en' | 'de' | 'fr' | 'it'

const locales: Record<LocaleCode, Record<string, PrincipleLocaleEntry>> = {
    en,
    de,
    fr,
    it,
}

export function resolvePrincipleContent(
    principleId: string,
    locale: LocaleCode = 'en'
): PrincipleLocaleEntry {
    const localeEntries = locales[locale]
    // Try exact match first, then prefix (e.g. "P005_autonomy" → "P005")
    const content = localeEntries?.[principleId]
        ?? localeEntries?.[principleId.split('_')[0]]

    if (!content) {
        return {
            name: '',
            keywords: '',
            practice: '',
            category: '',
        }
    }

    return content
}
