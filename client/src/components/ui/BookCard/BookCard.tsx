import { useState, type ComponentProps, type ReactElement } from "react";
import { Link } from "react-router-dom";

import { StarRating } from "../StarRating";
import {
  getFallbackHueStyle,
  getInitials,
} from "../../../utils/colorFromString";

export type BookCardVariant = "featured" | "new" | "trending";

interface BookCardProps extends Omit<ComponentProps<typeof Link>, "children"> {
  title: string;
  author?: string | null | undefined;
  coverSrc?: string | null | undefined;
  coverUrl?: string | null | undefined;
  rating?: number | string | null | undefined;
  showAuthor?: boolean;
  variant?: BookCardVariant | undefined;
}

function normalizeRating(rating?: number | string | null): number | null {
  if (rating === null || rating === undefined || rating === "") return null;

  const value = typeof rating === "number" ? rating : Number.parseFloat(rating);
  if (!Number.isFinite(value)) return null;

  return Math.min(5, Math.max(0, value));
}

function badgeClass(variant: BookCardVariant): string {
  const base =
    "absolute left-3 top-3 z-20 rounded-full px-3 py-1 text-xs font-bold uppercase text-primary-black shadow-md";

  if (variant === "new") return `${base} animate-soft-pulse bg-accent`;
  if (variant === "trending") return `${base} bg-[var(--mood-hopeful)]`;

  return `${base} bg-[var(--mood-adventurous)]`;
}

interface CoverFallbackProps {
  title: string;
}

function CoverFallback({ title }: CoverFallbackProps): ReactElement {
  return (
    <div
      className="fallback-gradient flex aspect-[2/3] w-full items-center justify-center px-4 text-center text-4xl font-extrabold text-primary-white"
      style={getFallbackHueStyle(title)}
    >
      <span aria-hidden="true">{getInitials(title)}</span>
      <span className="sr-only">Cover unavailable for {title}</span>
    </div>
  );
}

export function BookCard({
  to,
  title,
  author,
  coverSrc,
  coverUrl,
  rating,
  showAuthor = true,
  variant,
  onClick,
  className = "",
  ...linkProps
}: BookCardProps): ReactElement | null {
  const [hasImageError, setHasImageError] = useState(false);
  const [isCoverLoaded, setIsCoverLoaded] = useState(false);
  const cover = coverSrc ?? coverUrl;
  const canShowImage = Boolean(cover) && !hasImageError;
  const normalizedRating = normalizeRating(rating);
  const authorLabel = author ? ` by ${author}` : "";
  const ariaLabel = `${title}${authorLabel}`;
  const coverWidthClass = variant === "featured" ? "max-w-[260px]" : "max-w-[210px]";

  if (!title.trim()) return null;

  return (
    <article
      role="article"
      aria-label={ariaLabel}
      className={`glass-card card-lift group relative h-full overflow-hidden ${className}`}
    >
      <Link
        to={to}
        onClick={onClick}
        className="block h-full rounded-xl focus-visible:outline-accent"
        aria-label={ariaLabel}
        {...linkProps}
      >
        <figure className="relative flex h-full min-h-[360px] flex-col items-center justify-center gap-4 overflow-hidden p-4 sm:gap-5 sm:p-6">
          <div className="absolute inset-0 bg-secondary-black/80" aria-hidden="true" />
          {variant ? (
            <span className={badgeClass(variant)}>{variant}</span>
          ) : null}
          {canShowImage ? (
            <img
              src={cover ?? undefined}
              className={`absolute inset-0 h-full w-full object-cover opacity-0 blur-[80px] transition-opacity duration-300 ease-out group-hover:opacity-50 ${
                isCoverLoaded ? "opacity-30" : ""
              }`}
              alt=""
              aria-hidden="true"
              draggable={false}
            />
          ) : null}
          <div
            className={`relative z-10 w-full ${coverWidthClass} overflow-hidden rounded-xl bg-primary-black shadow-xl`}
          >
            {canShowImage ? (
              <img
                src={cover ?? undefined}
                alt={`Cover of ${title}`}
                className={`aspect-[2/3] h-auto w-full object-cover opacity-0 transition-all duration-300 ease-out group-hover:scale-[1.03] ${
                  isCoverLoaded ? "animate-cover-fade opacity-100" : ""
                }`}
                width="220"
                height="330"
                loading="lazy"
                decoding="async"
                onLoad={() => setIsCoverLoaded(true)}
                onError={() => setHasImageError(true)}
              />
            ) : (
              <CoverFallback title={title} />
            )}
          </div>
          <figcaption className="glass-card absolute inset-x-3 bottom-3 z-20 translate-y-[calc(100%-3.25rem)] px-4 py-3 text-left transition-transform duration-200 ease-out group-hover:translate-y-0 group-focus-within:translate-y-0">
            <h3 className="book-title line-clamp-2 text-base" title={title}>
              {title}
            </h3>
            {showAuthor && author ? (
              <p className="mt-1 line-clamp-1 text-sm text-primary-gray" title={author}>
                {author}
              </p>
            ) : null}
            {normalizedRating !== null ? (
              <StarRating value={normalizedRating} size="sm" className="mt-2" />
            ) : null}
          </figcaption>
        </figure>
      </Link>
    </article>
  );
}

export type { BookCardProps };
