import type { ComponentProps, ReactElement } from "react";

interface BookCardSkeletonProps extends ComponentProps<"div"> {
  showAuthor?: boolean;
}

export function BookCardSkeleton({
  className = "",
  showAuthor = true,
  ...divProps
}: BookCardSkeletonProps): ReactElement {
  return (
    <div
      className={`h-full overflow-hidden rounded-lg border border-[var(--surface-glass-border)] bg-secondary-black/80 shadow-[0_18px_48px_color-mix(in_srgb,var(--color-primary-black)_32%,transparent)] ${className}`}
      aria-busy="true"
      aria-label="Loading book"
      role="status"
      {...divProps}
    >
      <div className="flex h-full flex-col">
        <div className="aspect-[2/3] min-h-[150px] w-full rounded-t-lg animate-shimmer" />
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="h-6 w-28 rounded-full animate-shimmer" />
          <div className="h-5 w-11/12 rounded-full animate-shimmer" />
          <div className="h-5 w-2/3 rounded-full animate-shimmer" />
          {showAuthor ? (
            <div className="h-4 w-1/2 rounded-full animate-shimmer" />
          ) : null}
          <div className="mt-auto h-4 w-24 rounded-full animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
