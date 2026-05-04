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
      className={`glass-card h-full min-h-[360px] overflow-hidden p-4 sm:p-6 ${className}`}
      aria-busy="true"
      aria-label="Loading book"
      role="status"
      {...divProps}
    >
      <div className="flex h-full flex-col items-center justify-center gap-4 sm:gap-5">
        <div className="aspect-[2/3] w-full max-w-[210px] rounded-xl animate-shimmer" />
        <div className="glass-card w-full px-4 py-3">
          <div className="h-5 w-3/4 rounded-full animate-shimmer" />
          {showAuthor ? (
            <div className="mt-3 h-4 w-1/2 rounded-full animate-shimmer" />
          ) : null}
        </div>
      </div>
    </div>
  );
}
