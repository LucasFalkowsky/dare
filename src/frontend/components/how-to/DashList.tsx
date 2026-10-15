interface DashListProps {
  items: { key: string; text: string; suffix?: React.ReactNode }[];
}

/**
 * The dash is a flex sibling rather than a `::before`, so wrapped lines hang
 * under the text instead of under the dash. It is hidden from assistive
 * technology — the `ul` already announces the list.
 */
export function DashList({ items }: DashListProps) {
  return (
    <ul className="flex flex-col gap-1">
      {items.map(({ key, text, suffix }) => (
        <li key={key} className="flex max-w-[68ch] gap-2 text-sm leading-snug text-fg-default">
          <span aria-hidden className="shrink-0 text-fg-subtle">
            —
          </span>
          <span>
            {text}
            {suffix}
          </span>
        </li>
      ))}
    </ul>
  );
}
