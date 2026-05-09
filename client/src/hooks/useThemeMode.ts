import { useCallback, useEffect, useState } from "react";

import {
  applyTheme,
  getInitialTheme,
  getLightModeQuery,
  getStoredTheme,
  persistTheme,
  type ThemeMode,
} from "../lib/theme";

export function useThemeMode(): {
  theme: ThemeMode;
  toggleTheme: () => void;
} {
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia(getLightModeQuery());

    function handleSystemThemeChange(event: MediaQueryListEvent): void {
      if (getStoredTheme()) return;
      setTheme(event.matches ? "light" : "dark");
    }

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      persistTheme(nextTheme);
      applyTheme(nextTheme);
      return nextTheme;
    });
  }, []);

  return { theme, toggleTheme };
}
