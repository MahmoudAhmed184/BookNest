import type { ReactElement } from "react";

import { BookCardSkeleton } from "../../../../components/ui";

const metadataKeys = ["release", "pages", "language", "isbn"];

export function BookPageSkeleton(): ReactElement {
  return (
    <div className="py-12 animate-fade-up" role="status" aria-live="polite">
      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <div className="w-full max-w-[320px]">
          <BookCardSkeleton showAuthor={false} />
        </div>
        <div className="glass-card flex flex-col gap-5 p-6">
          <div className="h-10 w-3/4 rounded-full animate-shimmer" />
          <div className="h-5 w-1/2 rounded-full animate-shimmer" />
          <div className="flex gap-3">
            <div className="h-11 w-36 rounded-xl animate-shimmer" />
            <div className="h-11 w-36 rounded-xl animate-shimmer" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {metadataKeys.map((key) => (
              <div key={key} className="h-14 rounded-xl animate-shimmer" />
            ))}
          </div>
          <div className="h-28 rounded-xl animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
