import type { ReactElement } from "react";

const statKeys = ["books", "pages", "genre", "streak"];

export function ProfileSkeleton(): ReactElement {
  return (
    <div className="flex flex-col gap-10 py-12 animate-fade-up" role="status" aria-live="polite">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="h-36 w-36 shrink-0 rounded-xl animate-shimmer sm:h-40 sm:w-40 md:h-44 md:w-44" />
        <div className="flex min-w-0 flex-col items-start gap-3">
          <div className="h-9 w-56 rounded-full animate-shimmer" />
          <div className="h-11 w-36 rounded-xl animate-shimmer" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statKeys.map((key) => (
          <div key={key} className="h-20 rounded-xl animate-shimmer" />
        ))}
      </div>
      <div className="h-28 rounded-xl animate-shimmer" />
    </div>
  );
}
