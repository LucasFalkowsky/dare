import { ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { BoxBody } from "../ui/box";
import type { Translate } from "./types";

/** Language-neutral, so it stays out of the dictionaries. */
const SOURCE = "DARE Cook Book — Deliberative, Agile and Responsive Ethics, Version 2.1";

/**
 * The only explanation on the page, and the only disclosure level besides
 * the page itself — two levels total, never three.
 */
export function WhyCollapsible({ t }: { t: Translate }) {
  return (
    <Collapsible>
      <CollapsibleTrigger className="group flex w-full items-center gap-1.5 rounded-lg border border-border-default bg-canvas px-4 py-2.5 text-left text-sm font-semibold text-fg-default hover:bg-canvas-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-fg">
        <ChevronRight
          className="h-4 w-4 shrink-0 text-fg-muted motion-safe:transition-transform motion-reduce:transition-none group-data-[state=open]:rotate-90"
          aria-hidden
        />
        {t("howTo.why.trigger")}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <BoxBody className="flex flex-col gap-3 px-4 pt-3 pb-0">
          <p className="max-w-[68ch] text-sm leading-snug text-fg-default">
            {t("howTo.why.method")}
          </p>
          <p className="max-w-[68ch] text-sm leading-snug text-fg-default">
            {t("howTo.why.simplified")}
          </p>
          <p className="max-w-[68ch] text-xs leading-snug text-fg-muted">
            {t("howTo.why.lineage")} <cite>{SOURCE}</cite>
          </p>
        </BoxBody>
      </CollapsibleContent>
    </Collapsible>
  );
}
