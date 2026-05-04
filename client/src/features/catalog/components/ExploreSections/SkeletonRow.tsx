import type { ReactElement } from "react";

import { BookCardSkeleton } from "../../../../components/ui";

const skeletonKeys = ["explore-skeleton-1", "explore-skeleton-2", "explore-skeleton-3", "explore-skeleton-4"];

export function SkeletonRow(): ReactElement {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" role="status" aria-live="polite">
      {skeletonKeys.map((key) => (
        <BookCardSkeleton key={key} />
      ))}
    </div>
  );
}
