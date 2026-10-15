import { BoxBody } from "../ui/box";
import type { Translate } from "./types";

/** Order is fixed here, not in the dictionaries — see ADR-012 on keyed objects. */
const TERMS = ["principle", "interpretation", "position", "setAside"] as const;

/**
 * Pre-training: the four words the rest of the page uses, before any
 * procedure. Naming the parts before the process is the cheapest large
 * gain available on a page like this.
 */
export function VocabularyCard({ t }: { t: Translate }) {
  return (
    <BoxBody>
      <dl className="grid gap-3 sm:grid-cols-2">
        {TERMS.map((key) => (
          <div
            key={key}
            className="rounded-lg border border-border-muted bg-canvas-subtle px-3 py-2.5"
          >
            <dt className="text-sm font-semibold text-fg-default">
              {t(`howTo.vocabulary.terms.${key}.term`)}
            </dt>
            <dd className="mt-1 text-sm leading-snug text-fg-muted">
              {t(`howTo.vocabulary.terms.${key}.def`)}
            </dd>
          </div>
        ))}
      </dl>
    </BoxBody>
  );
}
