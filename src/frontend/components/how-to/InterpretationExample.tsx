import { CircleCheck, CircleX } from "lucide-react";
import { BoxBody } from "../ui/box";
import { Badge } from "../ui/badge";
import { DashList } from "./DashList";
import type { Translate } from "./types";

const CRITERIA = ["c1", "c2", "c3", "c4", "c5"] as const;

/**
 * The weak/good pair is marked by icon *and* text label, never by colour
 * alone — the distinction has to survive greyscale and a screen reader.
 */
const EXAMPLES = [
  { kind: "weak", Icon: CircleX, iconClass: "text-danger-fg", variant: "danger" },
  { kind: "good", Icon: CircleCheck, iconClass: "text-success-fg", variant: "success" },
] as const;

export function InterpretationExample({ t }: { t: Translate }) {
  return (
    <BoxBody className="flex flex-col gap-4">
      <p className="max-w-[68ch] text-sm leading-snug text-fg-muted">
        {t("howTo.interpretation.lead")}
      </p>

      <div className="flex flex-col gap-1.5">
        <h3 className="text-xs font-semibold text-fg-muted">
          {t("howTo.interpretation.criteriaTitle")}
        </h3>
        <DashList
          items={CRITERIA.map((key) => ({
            key,
            text: t(`howTo.interpretation.criteria.${key}`),
          }))}
        />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-fg-muted">
          {t("howTo.interpretation.examplePrinciple")}
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          {EXAMPLES.map(({ kind, Icon, iconClass, variant }) => {
            const whyId = `howto-example-${kind}-why`;
            return (
              <div
                key={kind}
                className="flex flex-col gap-2 rounded-lg border border-border-muted bg-canvas-subtle p-3"
              >
                <div className="flex items-center gap-1.5">
                  <Icon className={`h-4 w-4 shrink-0 ${iconClass}`} aria-hidden />
                  <Badge variant={variant}>{t(`howTo.interpretation.${kind}Label`)}</Badge>
                </div>
                <q
                  aria-describedby={whyId}
                  className="text-sm leading-snug font-medium text-fg-default"
                >
                  {t(`howTo.interpretation.${kind}`)}
                </q>
                <p id={whyId} className="text-xs leading-snug text-fg-muted">
                  {t(`howTo.interpretation.${kind}Why`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </BoxBody>
  );
}
