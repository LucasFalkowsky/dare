# Principles Management – Component Structure

```
components/principles-management/
├── PrinciplesManagement.tsx     Root: deck state, hint, auto-save
│   ├── OnboardingHint.tsx       Dismissible hint banner (controlled)
│   ├── «HelpButton»             File-private: re-shows hint
│   ├── «AutoSaveIndicator»      File-private: saving / saved line
│   │
│   └── ProjectDeck.tsx          Interpret and rank in one list
│       ├── StepCardHeader.tsx   Card title + action slot
│       ├── «DeckCounters»       File-private: relevant / set-aside counts
│       ├── «SetAsideButton»     File-private: bottomSlot for irrelevant
│       ├── «AnimatePresence»    motion/react card list animation
│       ├── useLongPressReorder  Press-and-hold drag & drop over the whole row
│       └── PrincipleRowCard.tsx ─── (see below)
│
└── PrincipleRowCard.tsx         Collapsible principle row
    ├── PrincipleAvatar.tsx      Avatar image / initials
    ├── «DetailSection»          File-private: label + text block (×2)
    └── Collapsible              Radix UI expand/collapse
```

### Supporting files

```
principles-management/
├── StepCardHeader.tsx           Extracted shared card header
├── OnboardingHint.tsx           Controlled hint banner
├── useLongPressReorder.ts       Hold-to-drag reorder gesture (hook)
├── types.ts                     Principle, DeckInterpretations, …
└── index.ts                     Public re-exports
```

### Row gesture

The whole row is one surface (see ADR 011):

| Gesture | Result |
|---|---|
| Short click on row surface | Expands / collapses the row |
| Press and hold (≥ 180 ms), then move | Drags the row to a new priority position |
| `Alt` + `ArrowUp` / `ArrowDown` | Moves the focused row one position |
| Click on a control inside the row | Only that control acts (`isRowGesture`) |

### Legend

| Symbol | Meaning |
|---|---|
| `«name»` | File-private sub-component (not exported) |
| `──` (shared) | Component used by more than one parent |

---

# How-To – Component Structure

```
components/how-to/
├── HowToPage.tsx                Root: ?lang= override, page shell, section order
│   ├── «BackLink»               File-private: anchor back to the deck
│   ├── «AnchorRow»              File-private: jump links to the four sections
│   │
│   ├── HowToSection.tsx         Box + title + Diátaxis zone badge
│   │   └── StepCardHeader ───   (shared with principles-management)
│   │
│   ├── VocabularyCard.tsx       Pre-training: the four terms, before anything else
│   ├── PrincipleReference.tsx   The nine principles, grouped by category
│   │   └── PrincipleAvatar ───  (shared with principles-management)
│   ├── InterpretationExample.tsx  Criteria + weak/good pair
│   ├── PriorityExplainer.tsx    What the order means, then how to work the deck
│   └── IntegrationExplainer.tsx Three steps, no tool specifics
│
└── WhyCollapsible.tsx           Background, collapsed by default (Radix Collapsible)
```

### Supporting files

```
how-to/
├── types.ts                     Translate, SectionKind
└── index.ts                     Public re-export (HowToPage only)

lib/
└── useRoute.ts                  Two routes over the History API (see ADR 012)

locales/how-to/
├── en.ts                        Type source: HowToTranslation
├── de.ts                        Written first; formal "Sie"
├── fr.ts, it.ts                 Machine-translated, TODO i18n-review
└── completeness.test.ts         Guards key parity across all four locales
```

### Routing

| Path | View |
|---|---|
| `/` | `PrinciplesManagement` |
| `/how-to` | `HowToPage` |
| anything else | `PrinciplesManagement` (no 404 view) |

`/how-to` is the only possible name for the second route: the dev server proxies
`/api`, `/trpc`, `/principles`, `/health` and `/webhooks` to the backend.

`?lang=<locale>` overrides the display language **for the How-To page only** — a
global switch would change the locale the deck sends to the backend and so create
a second set of work-item labels (ADR 012).
