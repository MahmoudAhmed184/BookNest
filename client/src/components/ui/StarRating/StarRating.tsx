import type { ReactElement } from "react";

const starPath =
  "m12 2.75 2.84 5.75 6.35.92-4.6 4.48 1.08 6.32L12 16.9 6.32 19.9l1.08-6.32-4.6-4.48 6.36-.92L12 2.75Z";

interface StarIconProps {
  fillPercent: number;
  className?: string | undefined;
}

function clampRating(value: number, max: number): number {
  return Math.min(max, Math.max(0, value));
}

function StarIcon({
  fillPercent,
  className = "h-5 w-5",
}: StarIconProps): ReactElement {
  const clippedWidth = `${Math.max(0, Math.min(100, fillPercent))}%`;

  return (
    <span className={`relative inline-flex ${className}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" className="h-full w-full text-primary-gray">
        <path d={starPath} fill="currentColor" />
      </svg>
      <svg
        viewBox="0 0 24 24"
        className="absolute inset-0 h-full w-full overflow-hidden text-accent"
        style={{ clipPath: `inset(0 ${100 - parseFloat(clippedWidth)}% 0 0)` }}
      >
        <path d={starPath} fill="currentColor" />
      </svg>
    </span>
  );
}

interface StarRatingProps {
  value: number;
  max?: number | undefined;
  size?: "sm" | "md" | "lg" | undefined;
  readOnly?: boolean | undefined;
  className?: string | undefined;
  label?: string | undefined;
  onChange?: ((value: number) => void) | undefined;
}

const sizeClasses: Record<NonNullable<StarRatingProps["size"]>, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-7 w-7",
};

export function StarRating({
  value,
  max = 5,
  size = "md",
  readOnly = true,
  className = "",
  label,
  onChange,
}: StarRatingProps): ReactElement {
  const safeValue = clampRating(value, max);
  const roundedValue = Math.round(safeValue * 2) / 2;
  const ariaLabel = label ?? `Rating: ${roundedValue} out of ${max}`;
  const isInteractive = Boolean(onChange) && !readOnly;

  if (isInteractive) {
    return (
      <div
        className={`flex items-center gap-1 ${className}`}
        role="radiogroup"
        aria-label={ariaLabel}
      >
        {Array.from({ length: max }, (_, index) => index + 1).map((star) => (
          <button
            key={star}
            type="button"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl hover:bg-primary-black"
            onClick={() => onChange?.(star)}
            role="radio"
            aria-checked={roundedValue === star}
            aria-label={`${star} out of ${max}`}
          >
            <StarIcon
              fillPercent={roundedValue >= star ? 100 : 0}
              className={sizeClasses[size]}
            />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1 ${className}`} aria-label={ariaLabel}>
      {Array.from({ length: max }, (_, index) => {
        const star = index + 1;
        const fillPercent = clampRating(roundedValue - index, 1) * 100;

        return (
          <StarIcon
            key={star}
            fillPercent={fillPercent}
            className={sizeClasses[size]}
          />
        );
      })}
    </div>
  );
}
