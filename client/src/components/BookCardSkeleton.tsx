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
      className={`rounded-xl bg-secondary-black shadow-md overflow-hidden p-4 sm:p-6 ${className}`}
      aria-hidden="true"
      {...divProps}
    >
      <div className="flex flex-col items-center gap-4 sm:gap-5">
        <div className="w-[180px] aspect-[2/3] rounded-xl animate-shimmer" />
        <div className="flex w-full flex-col items-center gap-2 sm:gap-3">
          <div className="h-5 w-3/4 rounded-full animate-shimmer" />
          {showAuthor ? (
            <div className="h-4 w-1/2 rounded-full animate-shimmer" />
          ) : null}
        </div>
      </div>
    </div>
  );
}
