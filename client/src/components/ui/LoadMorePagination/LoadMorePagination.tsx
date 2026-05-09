import type { ReactElement } from "react";

import { InlineSpinner } from "../InlineSpinner";

interface LoadMorePaginationProps {
  shownCount: number;
  totalCount: number;
  hasMore: boolean;
  onLoadMore: () => void;
  isLoading?: boolean;
  itemLabel?: string;
  ariaLabel?: string;
  className?: string;
}

export function LoadMorePagination({
  shownCount,
  totalCount,
  hasMore,
  onLoadMore,
  isLoading = false,
  itemLabel = "items",
  ariaLabel = "More results",
  className = "",
}: LoadMorePaginationProps): ReactElement | null {
  const safeShownCount = Math.max(0, Math.min(shownCount, totalCount));

  if (!hasMore || safeShownCount === 0) return null;

  return (
    <nav
      className={`flex flex-col items-center gap-3 py-4 ${className}`}
      aria-label={ariaLabel}
    >
      <p className="text-center text-sm text-primary-gray" aria-live="polite">
        Showing{" "}
        <span className="font-semibold text-primary-white">
          {safeShownCount.toLocaleString()}
        </span>{" "}
        of {totalCount.toLocaleString()} {itemLabel}
      </p>
      <button
        type="button"
        onClick={onLoadMore}
        disabled={isLoading}
        className="btn btn-primary-v inline-flex min-h-[44px] min-w-36 items-center justify-center gap-2 px-5 py-2 text-sm"
        aria-busy={isLoading}
      >
        {isLoading ? <InlineSpinner /> : null}
        {isLoading ? "Loading..." : "Show more"}
      </button>
    </nav>
  );
}
