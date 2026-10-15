/**
 * The How-To page resolves its own translator so that `?lang=` can override
 * the display language for this page alone — switching the global i18next
 * language would also change the locale the deck sends to the backend, which
 * creates a second set of work-item labels (see ADR-012).
 */
export type Translate = (key: string) => string;

export type SectionKind = "howto" | "reference" | "explanation";
