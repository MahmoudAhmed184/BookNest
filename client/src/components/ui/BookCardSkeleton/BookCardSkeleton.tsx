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
      className={`glass-card h-full overflow-hidden p-3 sm:p-4 ${className}`}
      aria-busy="true"
      aria-label="Loading book"
      role="status"
      {...divProps}
    >
      <div className="flex h-full flex-col gap-3">
        <div className="mx-auto aspect-[2/3] w-full max-w-[180px] rounded-lg animate-shimmer" />
        <div className="min-h-[76px] w-full px-1 py-1">
          <div className="h-5 w-3/4 rounded-full animate-shimmer" />
          {showAuthor ? (
            <div className="mt-3 h-4 w-1/2 rounded-full animate-shimmer" />
          ) : null}
        </div>
      </div>
    </div>
  );
}
