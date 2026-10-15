import { BoxHeader, BoxTitle } from "../ui/box";

interface StepCardHeaderProps {
  title: string;
  /** Counters or filters shown next to the title, Primer issue-list style. */
  meta?: React.ReactNode;
  action?: React.ReactNode;
}

export function StepCardHeader({ title, meta, action }: StepCardHeaderProps) {
  return (
    <BoxHeader>
      <div className="flex min-w-0 items-center gap-4">
        <BoxTitle>{title}</BoxTitle>
        {meta}
      </div>
      {action}
    </BoxHeader>
  );
}
