import { Lightbulb, X } from "lucide-react";
import { Flash } from "../ui/flash";

interface OnboardingHintProps {
  open: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
}

/** Primer `Flash` banner — GitHub's inline tip. */
export function OnboardingHint({ open, onDismiss, children }: OnboardingHintProps) {
  if (!open) return null;

  return (
    <Flash>
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-accent-fg" aria-hidden />
      <p className="flex-1 leading-snug">{children}</p>
      <button
        type="button"
        aria-label="Dismiss hint"
        onClick={onDismiss}
        className="mt-0.5 shrink-0 rounded p-0.5 text-fg-muted transition-colors hover:bg-neutral-muted hover:text-fg-default"
      >
        <X className="h-4 w-4" />
      </button>
    </Flash>
  );
}
