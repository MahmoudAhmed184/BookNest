import { getFallbackHueStyle, getInitials } from "../../../utils/colorFromString";
import type { ReadingCollection } from "../../collections/types/collection";
import type { Profile, ProfileInterest, UserSocialLink } from "../types/user";

export function resolveProfileImage(src?: string | null): string | undefined {
  if (!src) return undefined;
  return src.endsWith("image") ? `${src}.svg` : src;
}

export function getProfileDisplayName(profile: Profile): string {
  return profile.user.display_name?.trim() || profile.handle;
}

export function formatCompactNumber(value?: number | null): string {
  const safeValue = Math.max(0, value ?? 0);
  return new Intl.NumberFormat(undefined, {
    notation: safeValue >= 10000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(safeValue);
}

export function formatProfileDate(value?: string | null): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatActivityDate(value?: string | null): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function profileTypeLabel(profileType?: Profile["profile_type"]): string {
  if (!profileType) return "Reader";

  const labels: Record<NonNullable<Profile["profile_type"]>, string> = {
    creator: "Creator",
    librarian: "Librarian",
    reader: "Reader",
    staff: "Staff",
  };

  return labels[profileType];
}

export function normalizeExternalUrl(value?: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  return `https://${trimmed}`;
}

export function socialLinkLabel(link: UserSocialLink): string {
  return link.label?.trim() || link.platform || "Link";
}

export function primaryInterests(interests?: ProfileInterest[]): ProfileInterest[] {
  return [...(interests ?? [])]
    .sort((first, second) => second.weight - first.weight)
    .slice(0, 5);
}

export function favoriteGenreFromCollections(
  collections?: ReadingCollection[],
  interests?: ProfileInterest[]
): string {
  const weightedGenres = new Map<string, number>();

  collections?.forEach((collection) => {
    collection.items?.forEach((item) => {
      item.book_detail?.genres?.forEach((genre) => {
        weightedGenres.set(genre.name, (weightedGenres.get(genre.name) ?? 0) + 1);
      });
    });
  });

  const [topGenre] = [...weightedGenres.entries()].sort(
    ([, firstCount], [, secondCount]) => secondCount - firstCount
  )[0] ?? [];

  return (
    topGenre ??
    primaryInterests(interests)[0]?.genre_name ??
    "Eclectic"
  );
}

export function recentProfileCovers(collections?: ReadingCollection[]): string[] {
  return (
    collections
      ?.flatMap((collection) => collection.items ?? [])
      .map((item) => item.book_detail?.cover || item.book_detail?.cover_fallback_url)
      .filter((cover): cover is string => Boolean(cover))
      .slice(0, 5) ?? []
  );
}

export { getFallbackHueStyle, getInitials };
