import { Box } from "../ui/box";
import { Badge } from "../ui/badge";
import { StepCardHeader } from "../principles-management/StepCardHeader";
import type { SectionKind } from "./types";

/** Diátaxis zones stay visible, so instruction and reference never blend. */
const KIND_VARIANT: Record<SectionKind, "accent" | "default" | "done"> = {
  howto: "accent",
  reference: "default",
  explanation: "done",
};

interface HowToSectionProps {
  id?: string;
  title: string;
  kind: SectionKind;
  zoneLabel: string;
  children: React.ReactNode;
}

export function HowToSection({ id, title, kind, zoneLabel, children }: HowToSectionProps) {
  return (
    <Box id={id} className="scroll-mt-8">
      <StepCardHeader title={title} meta={<Badge variant={KIND_VARIANT[kind]}>{zoneLabel}</Badge>} />
      {children}
    </Box>
  );
}
