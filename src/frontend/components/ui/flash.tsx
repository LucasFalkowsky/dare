import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Primer `Flash` — the inline banner GitHub uses for notices and tips.
 */
const flashVariants = cva(
  "flex items-start gap-2 rounded-lg border px-4 py-3 text-sm text-fg-default",
  {
    variants: {
      variant: {
        default: "border-accent-muted bg-accent-subtle",
        success: "border-success-muted bg-success-subtle",
        warning: "border-attention-muted bg-attention-subtle",
        danger: "border-danger-muted bg-danger-subtle",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Flash({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof flashVariants>) {
  return <div data-slot="flash" className={cn(flashVariants({ variant }), className)} {...props} />;
}

export { Flash, flashVariants };
