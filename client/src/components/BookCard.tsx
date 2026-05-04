import { useState, type ReactElement } from "react";
import { Link } from "react-router-dom";

interface BookCardProps {
  to: string;
  title: string;
  author?: string | null | undefined;
  coverSrc?: string | null | undefined;
  rating?: number | string | null | undefined;
  showAuthor?: boolean;
  onClick?: () => void;
  className?: string;
}

function getInitials(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  const initials = words.slice(0, 2).map((word) => word[0]?.toUpperCase());
  return initials.join("") || "BN";
}

export default function BookCard({
  to,
  title,
  author,
  coverSrc,
  rating,
  showAuthor = true,
  onClick,
  className = "",
}: BookCardProps): ReactElement {
  const [hasImageError, setHasImageError] = useState(false);
  const canShowImage = Boolean(coverSrc) && !hasImageError;

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`group block overflow-hidden rounded-xl bg-secondary-black shadow-md transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-xl focus-visible:outline-accent [will-change:transform] ${className}`}
    >
      <figure className="relative flex flex-col items-center gap-4 p-4 sm:gap-5 sm:p-6">
        <div
          className="absolute inset-0 bg-secondary-black transition-opacity duration-300 ease-out group-hover:opacity-0"
          aria-hidden="true"
        />
        {canShowImage ? (
          <img
            src={coverSrc ?? undefined}
            className="absolute inset-0 h-full w-full object-cover opacity-0 blur-[100px] transition-opacity duration-300 ease-out group-hover:opacity-80"
            alt=""
            aria-hidden="true"
            draggable={false}
          />
        ) : null}
        <div className="relative z-10 w-[180px] overflow-hidden rounded-xl bg-primary-black shadow-md transition-transform duration-200 ease-out group-hover:-translate-y-2 group-hover:shadow-xl">
          {canShowImage ? (
            <img
              src={coverSrc ?? undefined}
              alt={`Cover of ${title}`}
              className="aspect-[2/3] h-auto w-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.03]"
              width="180"
              height="270"
              loading="lazy"
              decoding="async"
              onError={() => setHasImageError(true)}
            />
          ) : (
            <div className="flex aspect-[2/3] w-full items-center justify-center bg-secondary-gray px-4 text-center text-3xl font-semibold text-primary-white">
              <span aria-hidden="true">{getInitials(title)}</span>
              <span className="sr-only">Cover unavailable for {title}</span>
            </div>
          )}
        </div>
        <figcaption className="relative z-10 flex w-full flex-col items-center gap-2 text-center sm:gap-3">
          <h3
            className="line-clamp-2 text-base font-semibold text-primary-white transition-colors duration-200 ease-out group-hover:text-accent sm:text-lg"
            title={title}
          >
            {title}
          </h3>
          {showAuthor && author ? (
            <p
              className="line-clamp-1 text-sm text-primary-gray sm:text-base"
              title={author}
            >
              {author}
            </p>
          ) : null}
          {rating ? (
            <p
              className="text-sm text-primary-gray"
              aria-label={`Rating ${rating} out of 5`}
            >
              <span className="text-accent" aria-hidden="true">
                ★
              </span>{" "}
              {rating}
            </p>
          ) : null}
        </figcaption>
      </figure>
    </Link>
  );
}
