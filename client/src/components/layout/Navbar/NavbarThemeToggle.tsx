import type { ReactElement } from "react";

import type { ThemeMode } from "../../../lib/theme";

interface ThemeToggleProps {
  theme: ThemeMode;
  onToggle: () => void;
  tabIndex?: number | undefined;
}

function SunIcon(): ReactElement {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon(): ReactElement {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M20.99 12.95A8.5 8.5 0 1 1 11.05 3a6.5 6.5 0 0 0 9.94 9.95Z" />
    </svg>
  );
}

export function NavbarThemeToggle({
  theme,
  onToggle,
  tabIndex,
}: ThemeToggleProps): ReactElement {
  const nextThemeLabel = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      tabIndex={tabIndex}
      className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-full text-primary-white/90 hover:bg-secondary-black/70 hover:text-primary-white"
      aria-label={`Switch to ${nextThemeLabel} mode`}
      title={`Switch to ${nextThemeLabel} mode`}
      onClick={onToggle}
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

export function NavbarThemeMenuItem({
  theme,
  onToggle,
  tabIndex,
}: ThemeToggleProps): ReactElement {
  const nextThemeLabel = theme === "dark" ? "Light mode" : "Dark mode";

  return (
    <button
      type="button"
      tabIndex={tabIndex}
      className="flex min-h-[44px] w-full items-center justify-between gap-3 rounded-xl px-4 py-2 text-left text-sm font-medium text-primary-gray hover:bg-secondary-black hover:text-primary-white"
      onClick={onToggle}
    >
      <span>{nextThemeLabel}</span>
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
