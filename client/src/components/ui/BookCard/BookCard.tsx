import { useState, type ComponentProps, type ReactElement } from "react";
import { Link } from "react-router-dom";

import type { Book } from "../../../features/catalog/types/book";
import { getBookGenres } from "../../../features/catalog/utils/bookFacets";
import {
  getFallbackHueStyle,
  getInitials,
} from "../../../utils/colorFromString";

type BookCardVariant = "featured" | "new" | "trending";
type BookCardSize = "standard" | "large" | "small" | "compact";

interface BookCardProps extends Omit<ComponentProps<typeof Link>, "children"> {
  book?: Book | undefined;
  title?: string | undefined;
  author?: string | null | undefined;
  coverSrc?: string | null | undefined;
  coverUrl?: string | null | undefined;
  rating?: number | string | null | undefined;
  ratingCount?: number | null | undefined;
  genre?: string | null | undefined;
  pageCount?: number | null | undefined;
  showAuthor?: boolean;
  variant?: BookCardVariant | undefined;
  size?: BookCardSize | undefined;
}

function normalizeRating(rating?: number | string | null): number | null {
  if (rating === null || rating === undefined || rating === "") return null;

  const value = typeof rating === "number" ? rating : Number.parseFloat(rating);
  if (!Number.isFinite(value)) return null;

  return Math.min(5, Math.max(0, value));
}

function variantLabel(variant: BookCardVariant): string {
  if (variant === "new") return "New";
  if (variant === "trending") return "Trending";
  return "Featured";
}

function coverHeightClass(size: BookCardSize, variant?: BookCardVariant): string {
  if (size === "large") return "h-[340px]";
  if (size === "small") return "h-[300px]";
  if (size === "compact") return "h-[220px]";
  if (variant === "featured") return "h-[340px]";

  return "h-[320px]";
}

function formatRatingCount(count?: number | null): string | null {
  if (count === undefined || count === null) return null;

  return `${count.toLocaleString()} ${count === 1 ? "rating" : "ratings"}`;
}

function pageCountLabel(count?: number | null): string | null {
  if (count === undefined) return null;
  if (!count) return "Pages unknown";

  return `${count.toLocaleString()} pages`;
}

function getPrimaryGenre(book?: Book, explicitGenre?: string | null): string | null {
  const normalizedGenre = explicitGenre?.trim();
  if (normalizedGenre) return normalizedGenre;
  if (!book) return null;

  return getBookGenres(book)[0] ?? null;
}

interface CoverFallbackProps {
  title: string;
  className: string;
}

function CoverFallback({ title, className }: CoverFallbackProps): ReactElement {
  return (
    <div
      className={`fallback-gradient flex items-center justify-center px-4 text-center text-4xl font-extrabold text-primary-white ${className}`}
      style={getFallbackHueStyle(title)}
    >
      <span aria-hidden="true">{getInitials(title)}</span>
      <span className="sr-only">Cover unavailable for {title}</span>
    </div>
  );
}

interface StarIconProps {
  isFilled: boolean;
}

function StarIcon({ isFilled }: StarIconProps): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-4 w-4 ${isFilled ? "fill-accent text-accent" : "fill-transparent text-primary-gray"}`}
      aria-hidden="true"
    >
      <path
        d="m12 2.75 2.84 5.75 6.35.92-4.6 4.48 1.08 6.32L12 16.9 6.32 19.9l1.08-6.32-4.6-4.48 6.36-.92L12 2.75Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface BookOpenIconProps {
  className?: string | undefined;
}

function BookOpenIcon({
  className = "h-4 w-4",
}: BookOpenIconProps): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 7v14" />
      <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H12v18H5.5A2.5 2.5 0 0 0 3 23V5.5Z" />
      <path d="M21 5.5A2.5 2.5 0 0 0 18.5 3H12v18h6.5A2.5 2.5 0 0 1 21 23V5.5Z" />
    </svg>
  );
}

interface BookCardRatingProps {
  value: number;
  ratingCountLabel: string | null;
}

function BookCardRating({
  value,
  ratingCountLabel,
}: BookCardRatingProps): ReactElement {
  const roundedValue = Math.round(value);

  return (
    <div className="flex items-center justify-between gap-3">
      <div
        className="inline-flex items-center gap-1"
        aria-label={`Rating: ${roundedValue} out of 5`}
        role="img"
      >
        {Array.from({ length: 5 }, (_, index) => (
          <StarIcon key={index} isFilled={index < roundedValue} />
        ))}
      </div>
      {ratingCountLabel ? (
        <span className="text-xs font-bold text-primary-gray">
          {ratingCountLabel}
        </span>
      ) : null}
    </div>
  );
}

export function BookCard({
  to,
  book,
  title,
  author,
  coverSrc,
  coverUrl,
  rating,
  ratingCount,
  genre,
  pageCount,
  showAuthor = true,
  variant,
  size = "standard",
  onClick,
  className = "",
  ...linkProps
}: BookCardProps): ReactElement | null {
  const [hasImageError, setHasImageError] = useState(false);
  const [isCoverLoaded, setIsCoverLoaded] = useState(false);
  const resolvedTitle = (title ?? book?.title ?? "").trim();
  const resolvedAuthor = author ?? "";
  const cover = coverSrc ?? coverUrl ?? book?.cover ?? book?.cover_fallback_url;
  const canShowImage = Boolean(cover) && !hasImageError;
  const normalizedRating = normalizeRating(rating ?? book?.average_rating);
  const resolvedRatingCount = ratingCount ?? book?.rating_count;
  const ratingCountLabel = formatRatingCount(
    resolvedRatingCount ?? (book ? 0 : undefined)
  );
  const resolvedPageCount = pageCount ?? book?.page_count;
  const resolvedPageCountLabel = pageCountLabel(
    resolvedPageCount ?? (book ? null : undefined)
  );
  const badge =
    getPrimaryGenre(book, genre) ?? (variant ? variantLabel(variant) : null);
  const authorLabel = resolvedAuthor ? ` by ${resolvedAuthor}` : "";
  const ariaLabel = `${resolvedTitle}${authorLabel}`;
  const coverClass = coverHeightClass(size, variant);
  const isDense = size === "small" || size === "compact";
  const isCompact = size === "compact";

  if (!resolvedTitle) return null;

  return (
    <article
      role="article"
      aria-label={ariaLabel}
      className={`group overflow-hidden rounded-lg border border-[var(--surface-glass-border)] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--surface-panel)_92%,transparent),color-mix(in_srgb,var(--surface-panel-strong)_84%,transparent))] text-primary-white shadow-[0_18px_48px_color-mix(in_srgb,var(--color-primary-black)_32%,transparent)] transition-[transform,box-shadow] duration-200 ease-out [-webkit-tap-highlight-color:transparent] hover:-translate-y-1 hover:shadow-[0_24px_64px_color-mix(in_srgb,var(--color-primary-black)_42%,transparent)] ${
        isCompact ? "h-auto" : "h-full"
      } ${className}`}
    >
      <Link
        to={to}
        onClick={onClick}
        className={`flex flex-col rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent ${
          isCompact ? "h-auto" : "h-full"
        }`}
        aria-label={ariaLabel}
        {...linkProps}
      >
        <figure
          className={`flex w-full flex-col ${isCompact ? "h-auto" : "h-full"}`}
        >
          <div
            className={`relative flex justify-center overflow-hidden bg-primary-black ${coverClass}`}
          >
            {canShowImage ? (
              <>
                <img
                  src={cover ?? undefined}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full scale-110 object-cover object-center opacity-30 blur-xl"
                  loading="lazy"
                  decoding="async"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-primary-black/40"
                />
                <img
                  src={cover ?? undefined}
                  alt={`Cover of ${resolvedTitle}`}
                  className={`relative h-full w-full object-contain object-center p-3 opacity-0 drop-shadow-2xl transition duration-300 ease-out group-hover:scale-[1.025] ${
                    isCoverLoaded ? "opacity-100" : ""
                  }`}
                  width="320"
                  height="480"
                  loading="lazy"
                  decoding="async"
                  sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
                  onLoad={() => setIsCoverLoaded(true)}
                  onError={() => setHasImageError(true)}
                />
              </>
            ) : (
              <CoverFallback
                title={resolvedTitle}
                className="h-full w-full"
              />
            )}
          </div>
          <figcaption
            className={`flex flex-col text-left ${
              isCompact ? "" : "flex-1"
            } ${isDense ? "gap-1.5 p-3" : "gap-2 p-4"}`}
          >
            {badge ? (
              <span className={`w-fit rounded-full border border-[var(--surface-glass-border)] bg-primary-black/45 font-semibold text-accent shadow-sm backdrop-blur ${isDense ? "px-2.5 py-0.5 text-[0.6875rem]" : "px-3 py-1 text-xs"}`}>
                {badge}
              </span>
            ) : null}
            <h3
              className={`line-clamp-2 pt-1 font-display font-bold leading-tight text-primary-white text-balance ${isDense ? "text-base" : "text-lg"}`}
              title={resolvedTitle}
            >
              {resolvedTitle}
            </h3>
            {showAuthor && resolvedAuthor ? (
              <p className={`line-clamp-1 font-medium text-primary-gray ${isDense ? "text-xs" : "text-sm"}`} title={resolvedAuthor}>
                {resolvedAuthor}
              </p>
            ) : null}
            {normalizedRating !== null ? (
              <BookCardRating
                value={normalizedRating}
                ratingCountLabel={ratingCountLabel}
              />
            ) : ratingCountLabel ? (
              <p className="text-xs font-bold text-primary-gray">
                {ratingCountLabel}
              </p>
            ) : null}
            {size !== "compact" && resolvedPageCountLabel ? (
              <p className={`mt-auto flex items-center gap-2 font-medium text-primary-gray ${isDense ? "text-xs" : "text-sm"}`}>
                <BookOpenIcon className={isDense ? "h-3.5 w-3.5" : "h-4 w-4"} />
                <span>{resolvedPageCountLabel}</span>
              </p>
            ) : null}
          </figcaption>
        </figure>
      </Link>
    </article>
  );
}
