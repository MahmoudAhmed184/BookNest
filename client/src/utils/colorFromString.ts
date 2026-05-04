import type { CSSProperties } from "react";

interface FallbackHueStyle extends CSSProperties {
  "--fallback-hue": string;
}

export function colorFromString(value: string): number {
  const source = value.trim() || "BookNest";
  let hash = 0;

  for (const character of source) {
    hash = (hash * 31 + character.charCodeAt(0)) % 360;
  }

  return hash;
}

export function getInitials(value?: string | null): string {
  if (!value) return "BN";

  const initials = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

  return initials || "BN";
}

export function getFallbackHueStyle(value: string): FallbackHueStyle {
  return { "--fallback-hue": `${colorFromString(value)}deg` };
}
