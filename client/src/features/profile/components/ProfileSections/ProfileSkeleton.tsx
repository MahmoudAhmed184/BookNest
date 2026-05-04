import type { ReactElement } from "react";

const statKeys = ["books", "pages", "genre", "streak"];

export function ProfileSkeleton(): ReactElement {
  return (
    <div className="flex flex-col gap-10 py-12 animate-fade-up" role="status" aria-live="polite">
      <div className="flex flex-col gap-6 md:flex-row md:items-end">
        <div className="h-64 w-64 rounded-xl animate-shimmer" />
        <div className="flex grow flex-col gap-4">
          <div className="h-9 w-56 rounded-full animate-shimmer" />
          <div className="h-11 w-36 rounded-xl animate-shimmer" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statKeys.map((key) => (
          <div key={key} className="h-24 rounded-xl animate-shimmer" />
        ))}
      </div>
      <div className="h-28 rounded-xl animate-shimmer" />
    </div>
  );
}
