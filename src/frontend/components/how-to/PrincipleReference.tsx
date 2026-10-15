import { Fragment } from "react";
import { BoxGroupHeader, BoxRow } from "../ui/box";
import { Badge } from "../ui/badge";
import { PrincipleAvatar } from "../principles-management/PrincipleAvatar";
import { principleImage } from "../principles-management/types";
import { resolvePrincipleContent, type LocaleCode } from "../../../locales";

/**
 * Fixed id order, which is already category order (Beneficence, Dignity,
 * Justice). Names, keywords, practice and the category headings all come
 * from `src/locales` — never restate principle text on this page.
 */
const PRINCIPLE_IDS = [
  "P001",
  "P002",
  "P003",
  "P004",
  "P005",
  "P006",
  "P007",
  "P008",
  "P009",
] as const;

export function PrincipleReference({ locale }: { locale: LocaleCode }) {
  const entries = PRINCIPLE_IDS.map((id) => ({
    id,
    image: principleImage(id),
    ...resolvePrincipleContent(id, locale),
  }));

  const groups: { category: string; items: typeof entries }[] = [];
  for (const entry of entries) {
    const current = groups.at(-1);
    if (current && current.category === entry.category) current.items.push(entry);
    else groups.push({ category: entry.category, items: [entry] });
  }

  return (
    <>
      {groups.map((group) => (
        <Fragment key={group.category}>
          <BoxGroupHeader>
            <h3 className="text-xs font-semibold text-fg-muted">{group.category}</h3>
          </BoxGroupHeader>
          {group.items.map((principle) => (
            <BoxRow key={principle.id} className="flex items-start gap-3">
              <PrincipleAvatar name={principle.name} image={principle.image} size="sm-lg" />
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-sm font-semibold text-fg-default">{principle.name}</span>
                  <Badge variant="counter">{principle.id}</Badge>
                </div>
                <p className="text-xs leading-snug text-fg-muted">{principle.keywords}</p>
                <p className="max-w-[68ch] text-sm leading-snug text-fg-default">
                  {principle.practice}
                </p>
              </div>
            </BoxRow>
          ))}
        </Fragment>
      ))}
    </>
  );
}
