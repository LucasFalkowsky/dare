import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LayoutList, EyeOff, Undo2, CircleDot, CircleCheck, GripVertical } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { Box, BoxBody, BoxGroupHeader } from "../ui/box";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { StepCardHeader } from "./StepCardHeader";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { PrincipleRowCard } from "./PrincipleRowCard";
import { useLongPressReorder } from "./useLongPressReorder";
import type { Principle, DeckInterpretations, PrincipleInterpretation } from "./types";

interface ProjectDeckProps {
  /** All principles, the relevant ones in priority order. */
  deck: Principle[];
  interpretations: DeckInterpretations;
  onInterpretationChange: (id: string, next: PrincipleInterpretation) => void;
  /** The relevant principles in their new priority order. */
  onReorder: (relevant: Principle[]) => void;
  headerAction?: React.ReactNode;
}

const COACH_MARK_KEY = "principles-coach-mark-dismissed";

function SetAsideButton({ onSetAside }: { onSetAside: () => void }) {
  const { t } = useTranslation();
  return (
    <Button variant="outline" size="sm" aria-label={t("deck.setAside")} onClick={onSetAside}>
      <EyeOff className="h-3.5 w-3.5" />
      {t("deck.setAside")}
    </Button>
  );
}

/** Primer issue-list header: state counters next to the box title. */
function DeckCounters({ relevant, setAside }: { relevant: number; setAside: number }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-4 text-xs">
      <span className="flex items-center gap-1.5 font-semibold text-fg-default">
        <CircleDot className="h-4 w-4" aria-hidden />
        {t("deck.countRelevant", { count: relevant })}
      </span>
      <span className="flex items-center gap-1.5 text-fg-muted">
        <CircleCheck className="h-4 w-4" aria-hidden />
        {t("deck.countAside", { count: setAside })}
      </span>
    </div>
  );
}

/**
 * The deck: interpret each principle and rank it in one list. Position is
 * priority — top to bottom — and reordering is press-and-hold anywhere on the
 * row (see `useLongPressReorder`); a short click expands the row instead.
 */
export function ProjectDeck({ deck, interpretations, onInterpretationChange, onReorder, headerAction }: ProjectDeckProps) {
  const { t } = useTranslation();
  const [coachMarkDismissed, setCoachMarkDismissed] = useState(
    () => !!localStorage.getItem(COACH_MARK_KEY),
  );

  const relevant = deck.filter((p) => !interpretations[p.id]?.irrelevant);
  const setAside = deck.filter((p) => interpretations[p.id]?.irrelevant);

  /** Lift the row out and insert it at the target position. */
  const move = (from: number, to: number) => {
    if (from === to) return;
    const next = [...relevant];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onReorder(next);
  };

  const { dragIndex, dragOffset, getRowProps, dropEdgeFor } = useLongPressReorder({
    onMove: move,
    count: relevant.length,
  });

  const setIrrelevant = (id: string, irrelevant: boolean) =>
    onInterpretationChange(id, { ...interpretations[id], context: interpretations[id]?.context ?? "", irrelevant });

  const dismissCoachMark = () => {
    localStorage.setItem(COACH_MARK_KEY, "1");
    setCoachMarkDismissed(true);
  };

  return (
    <Box>
      <StepCardHeader
        title={t("deck.title")}
        meta={deck.length > 0 && <DeckCounters relevant={relevant.length} setAside={setAside.length} />}
        action={headerAction}
      />

      {deck.length === 0 ? (
        <BoxBody>
          <div className="flex flex-col items-center gap-2 py-10">
            <LayoutList className="h-8 w-8 text-fg-subtle" />
            <p className="text-center text-sm text-fg-muted">{t("deck.empty")}</p>
          </div>
        </BoxBody>
      ) : (
        <>
          {/* While a row travels, touch gestures must not scroll the list away. */}
          <div
            className="divide-y divide-border-muted"
            style={{ touchAction: dragIndex === null ? undefined : "none" }}
          >
            <AnimatePresence initial={false}>
              {relevant.map((p, i) => (
                <PrincipleRowCard
                  key={p.id}
                  principle={p}
                  stateLabel="relevant"
                  showCoachMark={!coachMarkDismissed && i === 0}
                  onExpand={!coachMarkDismissed && i === 0 ? dismissCoachMark : undefined}
                  rowProps={getRowProps(i)}
                  isDragging={dragIndex === i}
                  dragOffset={dragOffset}
                  dropEdge={dropEdgeFor(i)}
                  leftSlot={
                    <>
                      {/* Decorative: the whole row is the handle. */}
                      <span data-slot="drag-handle" aria-hidden title={t("card.dragToReorder")}>
                        <GripVertical className="h-4 w-4 text-fg-subtle transition-colors group-hover:text-fg-muted" />
                      </span>
                      <span className="w-5 text-right font-mono text-xs tabular-nums text-fg-subtle">
                        {i + 1}.
                      </span>
                    </>
                  }
                  projectContext={interpretations[p.id]?.context}
                  onContextChange={(context) =>
                    onInterpretationChange(p.id, { ...interpretations[p.id], context, irrelevant: false })
                  }
                  bottomSlot={<SetAsideButton onSetAside={() => setIrrelevant(p.id, true)} />}
                />
              ))}
            </AnimatePresence>
          </div>

          {setAside.length > 0 && (
            <>
              <BoxGroupHeader className="flex items-center gap-2">
                {t("deck.setAsideSection")}
                <Badge variant="counter">{setAside.length}</Badge>
              </BoxGroupHeader>
              <div className="divide-y divide-border-muted">
                {setAside.map((p) => (
                  <PrincipleRowCard
                    key={p.id}
                    principle={p}
                    faded
                    stateLabel="aside"
                    projectContext={interpretations[p.id]?.context}
                    rightSlot={
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="secondary"
                            size="icon-xs"
                            aria-label={t("deck.moveBack")}
                            onClick={() => setIrrelevant(p.id, false)}
                          >
                            <Undo2 className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">{t("deck.moveBack")}</TooltipContent>
                      </Tooltip>
                    }
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </Box>
  );
}
