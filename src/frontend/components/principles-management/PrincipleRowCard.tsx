import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Check, Pencil, CircleDot, CircleCheck, MessageSquare } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { PrincipleAvatar } from "./PrincipleAvatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { isRowGesture, type RowReorderProps } from "./useLongPressReorder";
import type { Principle } from "./types";

function DetailSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-fg-default">{label}</span>
      <div className="text-sm leading-normal text-fg-muted">{children}</div>
    </div>
  );
}

interface PrincipleRowCardProps {
  principle: Principle;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  bottomSlot?: React.ReactNode;
  faded?: boolean;
  /** Renders the Primer status icon and state label, issue-list style. */
  stateLabel?: "relevant" | "aside";
  /** The row is held and travelling — drawn lifted off the list. */
  isDragging?: boolean;
  /** Pixels the held row has travelled, so it follows the pointer. */
  dragOffset?: number;
  /** Draws the Primer insertion line on the edge the held row will land on. */
  dropEdge?: "top" | "bottom";
  /** Press-and-hold reordering handlers, spread onto the row surface. */
  rowProps?: RowReorderProps;
  projectContext?: string;
  onContextChange?: (context: string) => void;
  showCoachMark?: boolean;
  onExpand?: () => void;
}

/**
 * A single principle rendered as a GitHub issue-list row: status icon, bold
 * title, metadata line, labels on the right — and the detail view below reads
 * as an issue body with a comment box for the project interpretation.
 *
 * The whole row is one surface: a short click expands it, a press-and-hold
 * picks it up for reordering (see `useLongPressReorder`). Controls inside the
 * row keep their own clicks.
 */
export function PrincipleRowCard({
  principle,
  leftSlot,
  rightSlot,
  bottomSlot,
  faded,
  stateLabel,
  isDragging,
  dragOffset,
  dropEdge,
  rowProps,
  projectContext,
  onContextChange,
  showCoachMark,
  onExpand,
}: PrincipleRowCardProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [interpretationConfirmed, setInterpretationConfirmed] = useState(() => !!projectContext);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) onExpand?.();
  };

  const handleRowClick = (e: React.MouseEvent) => {
    if (!isRowGesture(e.target)) return;
    handleOpenChange(!open);
  };

  const showInterpretation = onContextChange !== undefined || !!projectContext;
  const hasContext = !!projectContext?.trim();
  const isAside = stateLabel === "aside";
  const StatusIcon = isAside ? CircleCheck : CircleDot;
  // "P001_beneficence" reads as noise in a list; GitHub shows the short handle.
  const shortId = principle.id.split("_")[0];

  return (
    <Collapsible open={open} onOpenChange={handleOpenChange}>
      <motion.div animate={{ opacity: faded ? 0.6 : 1 }} transition={{ duration: 0.3 }}>
        <div
          data-slot="row"
          {...rowProps}
          onClick={handleRowClick}
          style={
            isDragging
              ? // Out of the hit-testing path, so the row underneath stays the drop target.
                { transform: `translateY(${dragOffset ?? 0}px)`, pointerEvents: "none" }
              : undefined
          }
          className={`group relative flex select-none flex-col px-4 py-3 transition-colors
            ${isDragging
              ? "z-10 cursor-grabbing bg-canvas shadow-lg ring-1 ring-accent-emphasis"
              : "hover:bg-canvas-subtle"}
            ${rowProps ? "cursor-pointer" : ""}
            ${dropEdge === "top" ? "shadow-[inset_0_2px_0_0_var(--accent-emphasis)]" : ""}
            ${dropEdge === "bottom" ? "shadow-[inset_0_-2px_0_0_var(--accent-emphasis)]" : ""}
          `}
        >
          <div className="flex items-start gap-3">
            {leftSlot !== undefined && (
              <div className="flex w-12 shrink-0 items-center justify-center gap-1 pt-0.5">
                {leftSlot}
              </div>
            )}

            {stateLabel && (
              <StatusIcon
                aria-hidden
                className={`mt-0.5 h-4 w-4 shrink-0 ${isAside ? "text-done-fg" : "text-success-fg"}`}
              />
            )}

            <div className="flex min-w-0 flex-1 items-start gap-3">
              <PrincipleAvatar name={principle.name} image={principle.image} size="sm" />

              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-fg-default transition-colors group-hover:text-accent-fg">
                  {principle.name}
                </span>
                <span className="mt-0.5 block truncate text-xs text-fg-muted">
                  {shortId}
                  {" · "}
                  {hasContext ? t("card.interpreted") : t("card.notInterpreted")}
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-2 pt-0.5">
                {isAside && (
                  <Badge variant="done" className="hidden sm:inline-flex">
                    {t("deck.labelNotApplicable")}
                  </Badge>
                )}
                {hasContext && (
                  <span className="flex items-center gap-1 text-xs text-fg-muted" title={t("card.yourInterpretation")}>
                    <MessageSquare className="h-3.5 w-3.5" aria-hidden />1
                  </span>
                )}
              </div>

              {rightSlot !== undefined && (
                <div className="flex shrink-0 items-center pt-0.5">{rightSlot}</div>
              )}
            </div>

            <CollapsibleTrigger asChild>
              <button
                type="button"
                aria-label={t("card.expandDetails")}
                aria-keyshortcuts={rowProps ? "Alt+ArrowUp Alt+ArrowDown" : undefined}
                className="relative mt-0.5 shrink-0 rounded p-0.5 text-fg-muted transition-colors hover:bg-neutral-muted hover:text-fg-default"
              >
                {showCoachMark && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-emphasis opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-emphasis" />
                  </span>
                )}
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
              </button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent>
            {/*
              The detail view is text to read and write, not row surface: it
              neither collapses the row on click nor starts a drag.
            */}
            <div
              data-no-row-gesture
              className="mt-3 flex cursor-auto select-text flex-col gap-4 border-t border-border-muted pt-3"
            >
              <DetailSection label={t("card.whatIsIncluded")}>{principle.keywords}</DetailSection>
              <DetailSection label={t("card.inPractice")}>{principle.practice}</DetailSection>

              {showInterpretation && (
                // Primer comment box: subtle header strip, body below.
                <div className="overflow-hidden rounded-lg border border-border-default">
                  <div className="flex items-center justify-between gap-2 border-b border-border-default bg-canvas-subtle px-3 py-2">
                    <span className="text-xs font-semibold text-fg-default">
                      {t("card.yourInterpretation")}
                    </span>
                    {onContextChange && interpretationConfirmed && (
                      <Button
                        variant="ghost-muted"
                        size="icon-xs"
                        aria-label={t("card.editInterpretation")}
                        onClick={() => setInterpretationConfirmed(false)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  {onContextChange && !interpretationConfirmed ? (
                    <div className="flex flex-col gap-2 p-3">
                      <textarea
                        autoFocus
                        className="w-full resize-none rounded-lg border border-border-default bg-canvas px-3 py-2 text-sm text-fg-default placeholder:text-fg-subtle focus-visible:border-accent-emphasis focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-emphasis"
                        rows={3}
                        placeholder={t("card.interpretationPlaceholder", { name: principle.name })}
                        value={projectContext ?? ""}
                        onChange={(e) => onContextChange(e.target.value)}
                      />
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          disabled={!projectContext?.trim()}
                          onClick={() => setInterpretationConfirmed(true)}
                        >
                          <Check className="h-3.5 w-3.5" />
                          {t("card.done")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="px-3 py-2.5 text-sm leading-normal text-fg-default">{projectContext}</p>
                  )}
                </div>
              )}

              {bottomSlot && <div>{bottomSlot}</div>}
            </div>
          </CollapsibleContent>
        </div>
      </motion.div>
    </Collapsible>
  );
}
