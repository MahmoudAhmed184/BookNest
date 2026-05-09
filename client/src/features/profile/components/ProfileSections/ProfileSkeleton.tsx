import type { ReactElement } from "react";

const statKeys = ["books", "reviews", "followers", "lists"];
const shelfKeys = ["shelf-1", "shelf-2", "shelf-3"];

export function ProfileSkeleton(): ReactElement {
  return (
    <div className="flex flex-col gap-10 py-8 sm:py-12 animate-fade-up" role="status" aria-live="polite">
      <div className="rounded-lg border border-[var(--surface-glass-border)] p-4 sm:p-6 lg:p-8">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
              <div className="h-28 w-28 shrink-0 rounded-lg animate-shimmer sm:h-36 sm:w-36" />
              <div className="flex min-w-0 flex-1 flex-col items-start gap-3">
                <div className="h-7 w-36 rounded-lg animate-shimmer" />
                <div className="h-12 w-full max-w-md rounded-lg animate-shimmer" />
                <div className="h-5 w-32 rounded-lg animate-shimmer" />
                <div className="h-11 w-40 rounded-lg animate-shimmer" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {statKeys.map((key) => (
                <div key={key} className="h-24 rounded-lg animate-shimmer" />
              ))}
            </div>
          </div>
          <div className="min-h-64 rounded-lg animate-shimmer" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shelfKeys.map((key) => (
          <div key={key} className="h-48 rounded-lg animate-shimmer" />
        ))}
      </div>
      <div className="h-44 rounded-lg animate-shimmer" />
    </div>
  );
}
