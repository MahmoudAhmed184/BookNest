export type ThemeMode = "dark" | "light";

const THEME_STORAGE_KEY = "booknest.theme";
const LIGHT_MODE_QUERY = "(prefers-color-scheme: light)";

function isThemeMode(value: string | null): value is ThemeMode {
  return value === "dark" || value === "light";
}

function getSystemTheme(): ThemeMode {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "dark";
  }

  return window.matchMedia(LIGHT_MODE_QUERY).matches ? "light" : "dark";
}

export function getStoredTheme(): ThemeMode | null {
  if (typeof window === "undefined") return null;

  try {
    const theme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(theme) ? theme : null;
  } catch {
    return null;
  }
}

export function getInitialTheme(): ThemeMode {
  return getStoredTheme() ?? getSystemTheme();
}

export function persistTheme(theme: ThemeMode): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore blocked storage; the active document still receives the theme.
  }
}

export function applyTheme(theme: ThemeMode): void {
  if (typeof document === "undefined") return;

  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function initializeTheme(): ThemeMode {
  const theme = getInitialTheme();
  applyTheme(theme);
  return theme;
}

export function getLightModeQuery(): string {
  return LIGHT_MODE_QUERY;
}
