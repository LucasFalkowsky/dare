import { Flash } from "../ui/flash";
import { BoxBody } from "../ui/box";
import { DashList } from "./DashList";
import type { Translate } from "./types";

/**
 * Gesture wording mirrors `hints.deck` and `card.dragToReorder`. The hold
 * duration is deliberately described as "briefly" and not in milliseconds:
 * ADR-011 records the 180 ms as set rather than measured.
 */
const MECHANICS = [
  "position",
  "expand",
  "drag",
  "keyboard",
  "setAside",
  "autosave",
] as const;

function KeyboardHint() {
  return (
    <span className="ml-1.5 inline-flex items-center gap-0.5 align-middle">
      {["Alt", "↑", "↓"].map((key) => (
        <kbd
          key={key}
          className="rounded border border-border-default bg-canvas-subtle px-1 font-sans text-[11px] leading-[18px] text-fg-muted"
        >
          {key}
        </kbd>
      ))}
    </span>
  );
}

export function PriorityExplainer({ t }: { t: Translate }) {
  return (
    <BoxBody className="flex flex-col gap-4">
      <Flash className="flex-col gap-1">
        <p className="max-w-[68ch] leading-snug">{t("howTo.priority.meaning")}</p>
        <p className="max-w-[68ch] leading-snug text-fg-muted">
          {t("howTo.priority.notMeaning")}
        </p>
      </Flash>

      <div className="flex flex-col gap-1.5">
        <h3 className="text-xs font-semibold text-fg-muted">
          {t("howTo.priority.mechanicsTitle")}
        </h3>
        <DashList
          items={MECHANICS.map((key) => ({
            key,
            text: t(`howTo.priority.mechanics.${key}`),
            suffix: key === "keyboard" ? <KeyboardHint /> : undefined,
          }))}
        />
      </div>
    </BoxBody>
  );
}
