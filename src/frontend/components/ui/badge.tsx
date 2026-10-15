import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Primer `Label` (outlined pill) and `Counter` (filled grey pill).
 */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border px-2 text-xs leading-[18px] font-medium whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-border-default bg-transparent text-fg-muted",
        accent: "border-accent-muted bg-transparent text-accent-fg",
        success: "border-success-muted bg-transparent text-success-fg",
        attention: "border-attention-muted bg-transparent text-attention-fg",
        danger: "border-danger-muted bg-transparent text-danger-fg",
        done: "border-done-muted bg-transparent text-done-fg",
        counter: "border-transparent bg-neutral-muted px-1.5 text-fg-default tabular-nums",
        // Primer `StateLabel` — filled, used for open/closed state
        "state-open": "border-transparent bg-success-emphasis px-2.5 text-fg-on-emphasis",
        "state-closed": "border-transparent bg-done-fg px-2.5 text-fg-on-emphasis",
        secondary: "border-transparent bg-neutral-muted text-fg-default",
        destructive: "border-danger-muted bg-danger-subtle text-danger-fg",
        outline: "border-border-default bg-transparent text-fg-default",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";
  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
