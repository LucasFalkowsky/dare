import { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Check, Loader2, CircleHelp, BookOpen } from "lucide-react";
import { ROUTE_PATH } from "../../lib/useRoute";
import { ProjectDeck } from "./ProjectDeck";
import { OnboardingHint } from "./OnboardingHint";
import { trpc } from "../../lib/trpc";
import { mapDbPrinciple } from "./types";
import type { DeckInterpretations, Principle, PrincipleInterpretation } from "./types";

const HINT_KEY = "principles-hint-deck";
/** Interpretations and the ranking are written back this long after a change. */
const AUTOSAVE_DELAY_MS = 600;

function HelpButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <button type="button" aria-label={t("actions.showHint")} onClick={onClick} className="rounded p-0.5 text-fg-muted transition-colors hover:bg-neutral-muted hover:text-fg-default">
      <CircleHelp className="h-4 w-4" />
    </button>
  );
}

/**
 * A real anchor, not a button: the link gets copied and sent around during a
 * session, so the URL has to be right-clickable.
 */
function HowToLink({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  return (
    <a
      href={ROUTE_PATH["how-to"]}
      onClick={(event) => {
        if (!onNavigate) return;
        event.preventDefault();
        onNavigate();
      }}
      className="flex items-center gap-1 rounded px-1 py-0.5 text-xs text-fg-muted transition-colors hover:bg-neutral-muted hover:text-fg-default"
    >
      <BookOpen className="h-4 w-4" aria-hidden />
      {t("howTo.linkLabel")}
    </a>
  );
}

function AutoSaveIndicator({ saving }: { saving: boolean }) {
  const { t } = useTranslation();
  if (saving) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-fg-muted">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {t("actions.saving")}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs text-fg-muted">
      <Check className="h-3.5 w-3.5 text-success-fg" />
      {t("actions.saved")}
    </span>
  );
}

interface PrinciplesManagementProps {
  /** Omitted in tests; without it the How-To link is an ordinary page load. */
  onOpenHowTo?: () => void;
}

export function PrinciplesManagement({ onOpenHowTo }: PrinciplesManagementProps = {}) {
  const { t, i18n } = useTranslation();
  const locale = useMemo(() => i18n.language.split('-')[0], [i18n.language]);
  const [interpretations, setInterpretations] = useState<DeckInterpretations>({});
  /** Principle ids, the relevant ones in priority order. */
  const [order, setOrder] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deckReady, setDeckReady] = useState(false);

  const [hintOpen, setHintOpen] = useState(() => !localStorage.getItem(HINT_KEY));

  const dismissHint = () => {
    localStorage.setItem(HINT_KEY, "1");
    setHintOpen(false);
  };

  // --- Data queries ---
  const { data: rawPrinciples = [], isLoading } = trpc.principle.getAll.useQuery();
  const { data: latestDeck, isLoading: isDeckLoading } = trpc.deck.getLatest.useQuery();
  const { data: deckPrinciples } = trpc.deck.getPrinciples.useQuery(
    { deckId: latestDeck?.deckId ?? '' },
    { enabled: !!latestDeck },
  );

  // --- Mutations ---
  const addPrinciple = trpc.deck.addPrinciple.useMutation();
  const removePrinciple = trpc.deck.removePrinciple.useMutation();
  const rankPrinciples = trpc.deck.rankPrinciples.useMutation();

  // --- Deck ID management ---
  const deckIdRef = useRef<string | null>(null);

  const createDeck = trpc.deck.create.useMutation({
    onSuccess: (deck) => {
      deckIdRef.current = deck.deckId;
      setDeckReady(true);
    },
  });

  // Auto-create deck if none exists
  const deckCreateAttempted = useRef(false);
  useEffect(() => {
    if (isDeckLoading) return;
    if (latestDeck) {
      deckIdRef.current = latestDeck.deckId;
      setDeckReady(true);
    } else if (!deckCreateAttempted.current) {
      deckCreateAttempted.current = true;
      createDeck.mutate({ name: t('deck.title') });
    }
  }, [latestDeck, isDeckLoading]);

  const principles = useMemo(() => rawPrinciples.map(mapDbPrinciple), [rawPrinciples]);
  const principleById = useMemo(
    () => new Map(principles.map((p) => [p.id, p])),
    [principles],
  );

  // Every principle loaded joins the list; the stored ranking reorders it below.
  useEffect(() => {
    if (principles.length === 0) return;
    setOrder((prev) => {
      const known = prev.filter((id) => principleById.has(id));
      const added = principles.filter((p) => !known.includes(p.id)).map((p) => p.id);
      return added.length === 0 && known.length === prev.length ? prev : [...known, ...added];
    });
  }, [principles, principleById]);

  // Restore state from saved deck principles
  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current) return;
    if (!deckPrinciples || deckPrinciples.length === 0 || rawPrinciples.length === 0) return;
    restoredRef.current = true;

    const restoredInterpretations: DeckInterpretations = {};
    for (const p of rawPrinciples) {
      const dp = deckPrinciples.find((d) => d.principleId === p.principleId);
      restoredInterpretations[p.principleId] = dp
        ? { context: dp.projectContext ?? '', irrelevant: false }
        : { context: '', irrelevant: true };
    }
    setInterpretations(restoredInterpretations);

    const ranked = [...deckPrinciples]
      .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity))
      .map((dp) => dp.principleId);
    setOrder((prev) => [...ranked, ...prev.filter((id) => !ranked.includes(id))]);
  }, [deckPrinciples, rawPrinciples]);

  const deck = useMemo(
    () => order.map((id) => principleById.get(id)).filter((p): p is Principle => !!p),
    [order, principleById],
  );

  // --- Auto-save ---
  const contextTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const rankTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(
    () => () => {
      clearTimeout(rankTimer.current);
      for (const timer of Object.values(contextTimers.current)) clearTimeout(timer);
    },
    [],
  );

  /** Persist position-as-priority for the relevant principles, debounced. */
  const scheduleRankingSave = (relevantIds: string[]) => {
    clearTimeout(rankTimer.current);
    rankTimer.current = setTimeout(() => {
      const deckId = deckIdRef.current;
      if (!deckId) return;
      rankPrinciples.mutate({
        deckId,
        rankings: relevantIds.map((id, i) => ({ principleId: id, rank: i })),
        locale,
      });
    }, AUTOSAVE_DELAY_MS);
  };

  const handleInterpretationChange = (id: string, next: PrincipleInterpretation) => {
    const previous = interpretations[id];
    const nextInterpretations = { ...interpretations, [id]: next };
    setInterpretations(nextInterpretations);

    const deckId = deckIdRef.current;
    if (!deckId) return;

    const wasIrrelevant = previous?.irrelevant ?? false;
    const nowIrrelevant = next.irrelevant;

    if (wasIrrelevant !== nowIrrelevant) {
      // Membership changed, so every remaining rank shifts with it.
      scheduleRankingSave(order.filter((pid) => !nextInterpretations[pid]?.irrelevant));
    }

    if (wasIrrelevant && !nowIrrelevant) {
      // Moved back to relevant → add to deck
      setSaving(true);
      addPrinciple.mutate(
        { deckId, principleId: id, projectContext: next.context || undefined },
        { onSettled: () => setSaving(false) },
      );
    } else if (!wasIrrelevant && nowIrrelevant) {
      // Set aside → remove from deck
      clearTimeout(contextTimers.current[id]);
      setSaving(true);
      removePrinciple.mutate(
        { deckId, principleId: id },
        { onSettled: () => setSaving(false) },
      );
    } else if (!nowIrrelevant && next.context !== (previous?.context ?? '')) {
      // Context changed → debounced upsert
      clearTimeout(contextTimers.current[id]);
      contextTimers.current[id] = setTimeout(() => {
        setSaving(true);
        addPrinciple.mutate(
          { deckId, principleId: id, projectContext: next.context || undefined },
          { onSettled: () => setSaving(false) },
        );
      }, AUTOSAVE_DELAY_MS);
    }
  };

  const handleReorder = (relevant: Principle[]) => {
    const relevantIds = relevant.map((p) => p.id);
    setOrder([...relevantIds, ...order.filter((id) => !relevantIds.includes(id))]);
    scheduleRankingSave(relevantIds);
  };

  const isSaving = saving || addPrinciple.isPending || removePrinciple.isPending || rankPrinciples.isPending;

  return (
    <div className="min-h-screen bg-canvas flex justify-center px-4 py-8 md:px-8 md:py-12">
      <div className="w-full max-w-3xl flex flex-col gap-4">
        <OnboardingHint open={hintOpen} onDismiss={dismissHint}>
          {t("hints.deck")}
        </OnboardingHint>

        {isLoading ? (
          <p className="text-sm text-fg-muted text-center py-8">{t("actions.loading")}</p>
        ) : (
          <ProjectDeck
            deck={deck}
            interpretations={interpretations}
            onInterpretationChange={handleInterpretationChange}
            onReorder={handleReorder}
            headerAction={
              <div className="flex items-center gap-2">
                <HowToLink onNavigate={onOpenHowTo} />
                {!hintOpen && <HelpButton onClick={() => setHintOpen(true)} />}
              </div>
            }
          />
        )}

        {deckReady && (
          <div className="flex items-center">
            <AutoSaveIndicator saving={isSaving} />
          </div>
        )}
      </div>
    </div>
  );
}
