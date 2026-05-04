import type { ReactElement } from "react";

import { BookCardSkeleton } from "../../../../components/ui";

const skeletonKeys = [
  "search-skeleton-1",
  "search-skeleton-2",
  "search-skeleton-3",
  "search-skeleton-4",
  "search-skeleton-5",
  "search-skeleton-6",
  "search-skeleton-7",
  "search-skeleton-8",
];

export function SearchSkeletonGrid(): ReactElement {
  return (
    <div className="bento-grid" role="status" aria-live="polite">
      {skeletonKeys.map((key) => (
        <BookCardSkeleton key={key} />
      ))}
    </div>
  );
}
