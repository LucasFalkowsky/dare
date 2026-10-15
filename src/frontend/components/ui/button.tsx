import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Buttons follow GitHub Primer: 6px radius, 1px border, a hairline bottom
 * shadow, green for the primary action and grey-on-white for everything else.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border bg-clip-padding font-medium whitespace-nowrap transition-[background-color,border-color,color,box-shadow] outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent-fg disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-']):not([class*='h-'])]:size-4",
  {
    variants: {
      variant: {
        // Primer "primary" — the green submit button
        default:
          "border-btn-primary-border bg-btn-primary-bg text-fg-on-emphasis shadow-btn hover:bg-btn-primary-hover-bg",
        // Primer "default" — grey button with border
        outline:
          "border-btn-border bg-btn-bg text-fg-default shadow-btn hover:bg-btn-hover-bg active:bg-btn-active-bg aria-expanded:bg-btn-active-bg",
        secondary:
          "border-btn-border bg-btn-bg text-fg-default shadow-btn hover:bg-btn-hover-bg active:bg-btn-active-bg aria-expanded:bg-btn-active-bg",
        // Primer "invisible"
        ghost:
          "border-transparent bg-transparent text-accent-fg hover:bg-neutral-muted aria-expanded:bg-neutral-muted",
        "ghost-muted":
          "border-transparent bg-transparent text-fg-muted hover:bg-neutral-muted hover:text-fg-default aria-expanded:bg-neutral-muted",
        // Primer "danger" — red text that fills red on hover
        destructive:
          "border-btn-border bg-btn-bg text-danger-fg shadow-btn hover:border-danger-emphasis hover:bg-danger-emphasis hover:text-fg-on-emphasis",
        link: "border-transparent bg-transparent text-accent-fg hover:underline",
        chip: "border-btn-border bg-canvas font-mono text-fg-muted hover:bg-btn-hover-bg hover:text-fg-default aria-pressed:border-accent-emphasis aria-pressed:bg-accent-emphasis aria-pressed:text-fg-on-emphasis",
      },
      size: {
        // Primer medium (32px) / small (28px)
        default: "h-8 px-3 text-sm",
        sm: "h-7 px-3 text-xs",
        xs: "h-6 gap-1 px-2 text-xs [&_svg:not([class*='size-']):not([class*='h-'])]:size-3",
        lg: "h-10 px-4 text-sm",
        icon: "size-8",
        "icon-xs": "size-6 [&_svg:not([class*='size-']):not([class*='h-'])]:size-3",
        "icon-sm": "size-7",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
