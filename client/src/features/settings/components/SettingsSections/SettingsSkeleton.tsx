import type { ReactElement } from "react";

const skeletonKeys = ["account", "profile", "security"];

export function SettingsSkeleton(): ReactElement {
  return (
    <div className="flex flex-col gap-8 py-12 animate-fade-up" role="status" aria-live="polite">
      <div className="h-10 w-48 rounded-full animate-shimmer" />
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <div className="h-64 w-64 rounded-xl animate-shimmer" />
          <div className="h-28 rounded-xl animate-shimmer" />
        </div>
        <div className="glass-card flex flex-col gap-3 p-4">
          {skeletonKeys.map((key) => (
            <div key={key} className="h-12 rounded-xl animate-shimmer" />
          ))}
        </div>
      </div>
    </div>
  );
}
