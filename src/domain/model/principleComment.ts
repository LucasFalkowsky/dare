import { resolvePrincipleContent, LocaleCode } from '../../locales';
import { ALL_PRINCIPLE_IDS } from './principleVocabulary';

/**
 * Keywords are a scanning aid, not a glossary. Some principles carry fifteen of
 * them — printed in full they become the wall of text this comment is meant to
 * avoid, so the line is cut and the rest left to the principle's own page.
 */
const MAX_VISIBLE_KEYWORDS = 6;

function keywordLine(keywords: string): string {
  const all = keywords.split(',').map(k => k.trim()).filter(k => k !== '');
  const shown = all.slice(0, MAX_VISIBLE_KEYWORDS).join(', ');
  return all.length > MAX_VISIBLE_KEYWORDS ? `${shown} …` : shown;
}

/**
 * The comment a work item carries for one principle.
 *
 * Deliberately short: it sits in an issue thread people skim, so the principle
 * has to be recognizable at a glance and readable in a few seconds. The heading
 * carries the name, the second line the category and the keywords, then the one
 * actionable paragraph. Traceability — the id and the sibling principles — goes
 * last in small type, and the project interpretation is omitted entirely when
 * there is none, rather than printing an empty placeholder.
 *
 * Both comment paths build their body here: the webhook reacting to a changed
 * vocabulary and the deck synchronisation must not drift apart in wording.
 */
export function buildPrincipleCommentBody(
  principleId: string,
  projectContext?: string | null,
  locale: LocaleCode = 'en',
): string {
  const content = resolvePrincipleContent(principleId, locale);

  const related = ALL_PRINCIPLE_IDS
    .filter(id => id !== principleId)
    .map(id => ({ id, entry: resolvePrincipleContent(id, locale) }))
    .filter(({ entry }) => entry.category === content.category)
    .map(({ entry }) => entry.name)
    .join(' · ');

  // The project's own interpretation replaces the generic guidance rather than
  // being appended to it: where a team has said what the principle means for
  // them, that is the sentence worth reading — and two paragraphs saying
  // almost the same thing is exactly what makes a comment get skipped.
  const interpretation = projectContext?.trim();
  const source = interpretation ? 'Project interpretation' : 'DARE guidance';

  const lines = [
    `### 📌 ${content.name}`,
    `**${content.category}** — ${keywordLine(content.keywords)}`,
    '',
    interpretation || content.practice,
    '',
    related
      ? `<sub>DARE · \`${principleId}\` · ${source} · Related: ${related}</sub>`
      : `<sub>DARE · \`${principleId}\` · ${source}</sub>`,
  ];

  return lines.join('\n');
}
