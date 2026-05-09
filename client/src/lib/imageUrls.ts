import { API_BASE_URL } from "../config/env";

const backendMediaPrefixes = [
  "author_photos/",
  "book_covers/",
  "media/",
  "profile_pictures/",
];

function isExternalImageUrl(value: string): boolean {
  return /^(?:https?:|data:|blob:)/i.test(value);
}

function isBackendMediaPath(value: string): boolean {
  const normalized = value.replace(/^\/+/, "");
  return backendMediaPrefixes.some((prefix) => normalized.startsWith(prefix));
}

export function resolveImageUrl(src?: string | null): string | undefined {
  const value = src?.trim();
  if (!value) return undefined;

  if (isExternalImageUrl(value)) return value;

  const embeddedExternalUrl = value.match(/https?:\/\/.+/i)?.[0];
  if (embeddedExternalUrl) return embeddedExternalUrl;

  if (isBackendMediaPath(value)) {
    const normalized = value.replace(/^\/+/, "");
    const mediaPath = normalized.startsWith("media/")
      ? normalized
      : `media/${normalized}`;

    return `${API_BASE_URL}/${mediaPath}`;
  }

  return value.startsWith("/") ? value : `/${value}`;
}
