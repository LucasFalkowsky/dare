import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface PrincipleAvatarProps {
  name: string;
  image?: string;
  size?: "xs" | "sm" | "sm-lg" | "md" | "lg";
}

const SIZE_CLASSES = {
  xs: "size-5 text-xs",
  sm: "size-7 text-xs",
  "sm-lg": "size-[42px] text-sm",
  md: "size-9 text-sm",
  lg: "size-14 text-base",
};

export function PrincipleAvatar({ name, image, size = "sm" }: PrincipleAvatarProps) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Avatar className={SIZE_CLASSES[size]}>
      {image && <AvatarImage src={image} alt={name} className="object-contain p-0.5" />}
      <AvatarFallback className="text-muted-foreground font-medium border border-border bg-muted">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
