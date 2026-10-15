import { BoxBody } from "../ui/box";
import { Badge } from "../ui/badge";
import type { Translate } from "./types";

const STEPS = ["s1", "s2", "s3"] as const;

/**
 * Deliberately told without tool specifics: the page says what happens to
 * the team's work, not how the work-item platform is wired (ADR-012).
 */
export function IntegrationExplainer({ t }: { t: Translate }) {
  return (
    <BoxBody className="flex flex-col gap-4">
      <p className="max-w-[68ch] text-sm leading-snug text-fg-muted">
        {t("howTo.integration.lead")}
      </p>
      <ol className="flex flex-col gap-2 md:flex-row md:gap-3">
        {STEPS.map((key, index) => (
          <li
            key={key}
            className="flex flex-1 items-start gap-2 rounded-lg border border-border-muted bg-canvas-subtle px-3 py-2.5"
          >
            <Badge variant="counter">{index + 1}</Badge>
            <span className="text-sm leading-snug text-fg-default">
              {t(`howTo.integration.steps.${key}`)}
            </span>
          </li>
        ))}
      </ol>
    </BoxBody>
  );
}
