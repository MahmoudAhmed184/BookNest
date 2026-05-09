import type { ReactElement } from "react";

const metadataKeys = ["release", "pages", "language", "isbn"];

export function BookPageSkeleton(): ReactElement {
  return (
    <div className="py-12 animate-fade-up" role="status" aria-live="polite">
      <div className="grid gap-8 lg:grid-cols-[minmax(260px,360px)_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="mx-auto w-full max-w-[320px] lg:mx-0 lg:max-w-none">
          <div className="aspect-[2/3] rounded-xl animate-shimmer" />
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex gap-2">
            <div className="h-9 w-28 rounded-full animate-shimmer" />
            <div className="h-9 w-20 rounded-full animate-shimmer" />
          </div>
          <div className="h-20 w-full max-w-3xl rounded-2xl animate-shimmer" />
          <div className="h-5 w-1/2 rounded-full animate-shimmer" />
          <div className="glass-card flex flex-col gap-5 p-6">
            <div className="h-12 w-64 rounded-full animate-shimmer" />
            <div className="flex flex-wrap gap-3">
              <div className="h-11 w-36 rounded-xl animate-shimmer" />
              <div className="h-11 w-36 rounded-xl animate-shimmer" />
            </div>
            <div className="h-16 rounded-xl animate-shimmer" />
          </div>
          <div className="glass-card flex flex-col gap-5 p-6">
            <div className="h-10 w-56 rounded-full animate-shimmer" />
            <div className="h-32 rounded-xl animate-shimmer" />
            <div className="grid gap-5 sm:grid-cols-2">
              {metadataKeys.map((key) => (
                <div key={key} className="h-12 rounded-xl animate-shimmer" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
