import type { ReactElement } from "react";

const sectionKeys = ["account", "profile", "preferences", "security"];

export function SettingsSkeleton(): ReactElement {
  return (
    <div
      className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 py-8 animate-fade-up lg:py-12"
      role="status"
      aria-live="polite"
    >
      <div className="grid gap-3">
        <div className="h-4 w-28 rounded-full animate-shimmer" />
        <div className="h-12 w-full max-w-md rounded-lg animate-shimmer" />
        <div className="h-5 w-full max-w-2xl rounded-full animate-shimmer" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <div className="settings-panel hidden h-64 p-3 lg:block">
          <div className="grid gap-2">
            {sectionKeys.map((key) => (
              <div key={key} className="h-12 rounded-lg animate-shimmer" />
            ))}
          </div>
        </div>
        <div className="grid gap-5">
          <div className="settings-panel h-64 animate-shimmer" />
          {sectionKeys.map((key) => (
            <div key={key} className="settings-panel h-72 animate-shimmer" />
          ))}
        </div>
      </div>
    </div>
  );
}
