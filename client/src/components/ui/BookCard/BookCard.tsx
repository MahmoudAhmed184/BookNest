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
    "absolute left-2 top-2 z-20 rounded-full px-2.5 py-1 text-xs font-bold uppercase text-primary-black shadow-md";

  if (variant === "new") return `${base} animate-soft-pulse bg-accent`;
  if (variant === "trending") return `${base} bg-primary-white`;

  return `${base} bg-accent`;
}

function badgeLabel(variant: BookCardVariant): string {
  if (variant === "new") return "New";
  if (variant === "trending") return "Trending";
  return "Featured";
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
  const coverWidthClass = variant === "featured" ? "max-w-[240px]" : "max-w-[180px]";

  if (!title.trim()) return null;

  return (
    <article
      role="article"
      aria-label={ariaLabel}
      className={`glass-card card-lift group h-full overflow-hidden ${className}`}
    >
      <Link
        to={to}
        onClick={onClick}
        className="flex h-full rounded-xl p-3 focus-visible:outline-accent sm:p-4"
        aria-label={ariaLabel}
        {...linkProps}
      >
        <figure className="flex h-full w-full flex-col gap-3">
          <div className={`relative mx-auto w-full ${coverWidthClass}`}>
            {variant ? (
              <span className={badgeClass(variant)}>{badgeLabel(variant)}</span>
            ) : null}
            <div className="overflow-hidden rounded-lg bg-primary-black shadow-xl">
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
          </div>
          <figcaption className="flex min-h-[76px] flex-col text-left">
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
