import type { ReactElement } from "react";

const statSkeletonKeys = ["stat-1", "stat-2", "stat-3", "stat-4"];
const cardSkeletonKeys = ["collection-1", "collection-2", "collection-3"];

export function CollectionsSkeleton(): ReactElement {
  return (
    <div
      className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 py-8 lg:py-12"
      role="status"
      aria-live="polite"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-5">
          <div className="h-14 w-full max-w-xl rounded-lg animate-shimmer" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {statSkeletonKeys.map((key) => (
              <div key={key} className="h-28 rounded-lg animate-shimmer" />
            ))}
          </div>
        </div>
        <div className="h-[520px] rounded-lg animate-shimmer" />
      </div>
      <div className="h-36 rounded-lg animate-shimmer" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cardSkeletonKeys.map((key) => (
          <div key={key} className="h-[420px] rounded-lg animate-shimmer" />
        ))}
      </div>
    </div>
  );
}
