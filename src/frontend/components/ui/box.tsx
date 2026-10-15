import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Primer `Box` — the bordered container GitHub uses for issue lists, file
 * lists and settings panels: flat 1px border, 6px radius, a `canvas.subtle`
 * header strip and rows separated by hairlines instead of gaps.
 */
function Box({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="box"
      className={cn(
        "overflow-hidden rounded-lg border border-border-default bg-canvas text-fg-default",
        className,
      )}
      {...props}
    />
  );
}

function BoxHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="box-header"
      className={cn(
        "flex items-center justify-between gap-3 border-b border-border-default bg-canvas-subtle px-4 py-2.5",
        className,
      )}
      {...props}
    />
  );
}

function BoxTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="box-title"
      className={cn("text-sm font-semibold text-fg-default", className)}
      {...props}
    />
  );
}

function BoxRow({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="box-row"
      className={cn(
        "border-b border-border-muted px-4 py-3 last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

/** A `canvas.subtle` strip between rows — Primer's grouped-row heading. */
function BoxGroupHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="box-group-header"
      className={cn(
        "border-y border-border-muted bg-canvas-subtle px-4 py-2 text-xs font-semibold text-fg-muted",
        className,
      )}
      {...props}
    />
  );
}

function BoxBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="box-body" className={cn("px-4 py-4", className)} {...props} />;
}

function BoxFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="box-footer"
      className={cn(
        "flex items-center justify-end gap-2 border-t border-border-default bg-canvas-subtle px-4 py-3",
        className,
      )}
      {...props}
    />
  );
}

export { Box, BoxHeader, BoxTitle, BoxRow, BoxGroupHeader, BoxBody, BoxFooter };
