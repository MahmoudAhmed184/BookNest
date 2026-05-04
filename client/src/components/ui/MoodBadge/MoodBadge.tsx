import type { CSSProperties, ReactElement } from "react";

interface MoodBadgeStyle extends CSSProperties {
  "--mood-color": string;
}

export interface MoodBadgeProps {
  label: string;
  colorToken?: string | undefined;
  className?: string | undefined;
  size?: "sm" | "md" | undefined;
}

const sizeClasses: Record<NonNullable<MoodBadgeProps["size"]>, string> = {
  sm: "min-h-[32px] px-3 py-1 text-xs",
  md: "min-h-[36px] px-4 py-1.5 text-sm",
};

export function MoodBadge({
  label,
  colorToken = "var(--color-accent)",
  className = "",
  size = "sm",
}: MoodBadgeProps): ReactElement {
  const style: MoodBadgeStyle = { "--mood-color": colorToken };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-secondary-gray/70 bg-primary-black/40 font-medium text-primary-white ${sizeClasses[size]} ${className}`}
      style={style}
    >
      <span className="mood-dot h-2.5 w-2.5 rounded-full" aria-hidden="true" />
      {label}
    </span>
  );
}

export default MoodBadge;
