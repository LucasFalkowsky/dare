import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { uiResources } from "../../locales";
import { ROUTE_PATH } from "../../lib/useRoute";
import type { LocaleCode } from "../../../locales";
import { HowToSection } from "./HowToSection";
import { VocabularyCard } from "./VocabularyCard";
import { PrincipleReference } from "./PrincipleReference";
import { InterpretationExample } from "./InterpretationExample";
import { PriorityExplainer } from "./PriorityExplainer";
import { IntegrationExplainer } from "./IntegrationExplainer";
import { WhyCollapsible } from "./WhyCollapsible";
import { BoxBody } from "../ui/box";
import type { Translate } from "./types";

const SUPPORTED = Object.keys(uiResources);

const ANCHORS = [
  { id: "principles", key: "howTo.jump.principles" },
  { id: "interpretation", key: "howTo.jump.interpretation" },
  { id: "priority", key: "howTo.jump.priority" },
  { id: "integration", key: "howTo.jump.integration" },
] as const;

/**
 * Resolves the display language for this page only.
 *
 * `?lang=` must not switch the global i18next language: the deck sends the
 * active locale to `deck.rankPrinciples`, which is what names the work-item
 * labels. A global switch would create a second set of labels and orphan the
 * first (see ADR-012).
 */
function useHowToLocale(): { t: Translate; locale: LocaleCode } {
  const { t: detectedT, i18n } = useTranslation();

  const override = useMemo(() => {
    const requested = new URLSearchParams(window.location.search).get("lang");
    return requested && SUPPORTED.includes(requested) ? requested : null;
  }, []);

  const t = (override ? i18n.getFixedT(override) : detectedT) as Translate;
  const detected = i18n.language.split("-")[0];
  const locale = (override ?? (SUPPORTED.includes(detected) ? detected : "en")) as LocaleCode;

  return { t, locale };
}

interface HowToPageProps {
  /** Omitted in tests; without it the back link is an ordinary page load. */
  onBackToDeck?: () => void;
}

export function HowToPage({ onBackToDeck }: HowToPageProps) {
  const { t, locale } = useHowToLocale();

  return (
    <div className="flex min-h-screen justify-center bg-canvas px-4 py-8 md:px-8 md:py-12">
      <div lang={locale} className="flex w-full max-w-3xl flex-col gap-4">
        <a
          href={ROUTE_PATH.deck}
          onClick={(event) => {
            if (!onBackToDeck) return;
            event.preventDefault();
            onBackToDeck();
          }}
          className="flex w-fit items-center gap-1.5 text-sm text-accent-fg hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("howTo.backToDeck")}
        </a>

        <header className="flex flex-col gap-1.5">
          <h1 className="text-xl font-semibold text-fg-default">{t("howTo.title")}</h1>
          <p className="max-w-[68ch] text-sm leading-snug text-fg-muted">{t("howTo.lead")}</p>
          <nav className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            {ANCHORS.map((anchor) => (
              <a
                key={anchor.id}
                href={`#${anchor.id}`}
                className="text-sm text-accent-fg hover:underline"
              >
                {t(anchor.key)}
              </a>
            ))}
          </nav>
        </header>

        <HowToSection
          title={t("howTo.vocabulary.title")}
          kind="reference"
          zoneLabel={t("howTo.zone.reference")}
        >
          <VocabularyCard t={t} />
        </HowToSection>

        <HowToSection
          id="principles"
          title={t("howTo.principles.title")}
          kind="reference"
          zoneLabel={t("howTo.zone.reference")}
        >
          <BoxBody>
            <p className="max-w-[68ch] text-sm leading-snug text-fg-muted">
              {t("howTo.principles.lead")}
            </p>
          </BoxBody>
          <PrincipleReference locale={locale} />
        </HowToSection>

        <HowToSection
          id="interpretation"
          title={t("howTo.interpretation.title")}
          kind="howto"
          zoneLabel={t("howTo.zone.howto")}
        >
          <InterpretationExample t={t} />
        </HowToSection>

        <HowToSection
          id="priority"
          title={t("howTo.priority.title")}
          kind="howto"
          zoneLabel={t("howTo.zone.howto")}
        >
          <PriorityExplainer t={t} />
        </HowToSection>

        <HowToSection
          id="integration"
          title={t("howTo.integration.title")}
          kind="howto"
          zoneLabel={t("howTo.zone.howto")}
        >
          <IntegrationExplainer t={t} />
        </HowToSection>

        <WhyCollapsible t={t} />
      </div>
    </div>
  );
}
