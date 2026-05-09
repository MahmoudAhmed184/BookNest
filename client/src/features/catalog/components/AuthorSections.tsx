import { useMemo, useState, type ReactElement } from "react";
import { Link } from "react-router-dom";

import {
  BookCard,
  BookCardSkeleton,
  EmptyState,
  InlineSpinner,
} from "../../../components/ui";
import { routeBuilders, routePaths } from "../../../routes/paths";
import { getFallbackHueStyle, getInitials } from "../../../utils/colorFromString";
import type { Author, Book } from "../types/book";
import { getAuthorNames, getBookGenres } from "../utils/bookFacets";

const compactNumberFormatter = new Intl.NumberFormat("en", {
  maximumFractionDigits: 1,
  notation: "compact",
});
const standardNumberFormatter = new Intl.NumberFormat("en");
const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const skeletonBookKeys = [
  "author-book-1",
  "author-book-2",
  "author-book-3",
  "author-book-4",
];

interface AuthorHeroProps {
  author: Author;
  books: Book[];
  isLiked: boolean;
  isLikePending: boolean;
  onToggleLike: () => void;
}

interface AuthorBioProps {
  author: Author;
}

interface AuthorBooksProps {
  author: Author;
  books: Book[];
  isLoading: boolean;
  isFetching: boolean;
}

interface AuthorStat {
  label: string;
  value: string;
  detail: string;
}

interface AuthorDetail {
  label: string;
  value: string;
}

function formatCompactNumber(value: number | null | undefined): string {
  const number = Number.isFinite(value) ? Number(value) : 0;
  return compactNumberFormatter.format(number);
}

function formatStandardNumber(value: number | null | undefined): string {
  const number = Number.isFinite(value) ? Number(value) : 0;
  return standardNumberFormatter.format(number);
}

function pluralize(
  value: number | null | undefined,
  singular: string,
  plural = `${singular}s`
): string {
  const count = Number.isFinite(value) ? Number(value) : 0;
  return `${formatStandardNumber(count)} ${count === 1 ? singular : plural}`;
}

function normalizeRating(value?: number | string | null): number | null {
  if (value === null || value === undefined || value === "") return null;

  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return null;

  return Math.min(5, Math.max(0, parsed));
}

function getAverageRating(books: Book[]): number | null {
  const ratings = books
    .map((book) => normalizeRating(book.average_rating))
    .filter((rating): rating is number => rating !== null && rating > 0);

  if (ratings.length === 0) return null;

  return ratings.reduce((total, rating) => total + rating, 0) / ratings.length;
}

function getTopGenres(books: Book[]): string[] {
  const genreCounts = new Map<string, number>();

  books.forEach((book) => {
    getBookGenres(book).forEach((genre) => {
      genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
    });
  });

  return [...genreCounts.entries()]
    .sort((first, second) => second[1] - first[1] || first[0].localeCompare(second[0]))
    .slice(0, 3)
    .map(([genre]) => genre);
}

function getYear(value?: string | null): string | null {
  if (!value) return null;

  const parsed = Number.parseInt(value.slice(0, 4), 10);
  return Number.isFinite(parsed) ? String(parsed) : null;
}

function getAuthorTimeline(author: Author): string | null {
  const birthYear = getYear(author.birth_date);
  const deathYear = getYear(author.death_date);

  if (birthYear && deathYear) return `${birthYear} - ${deathYear}`;
  if (birthYear) return `Born ${birthYear}`;
  if (deathYear) return `Died ${deathYear}`;

  return null;
}

function formatDate(value?: string | null): string | null {
  if (!value) return null;

  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;

  return dateFormatter.format(new Date(timestamp));
}

function getAuthorImage(author: Author): string | null {
  return author.photo || author.photo_fallback_url || null;
}

function HeartIcon({
  isFilled,
  className = "h-4 w-4",
}: {
  isFilled: boolean;
  className?: string;
}): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={isFilled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  );
}

function ArrowRightIcon({
  className = "h-4 w-4",
}: {
  className?: string;
}): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function AuthorStatCard({ label, value, detail }: AuthorStat): ReactElement {
  return (
    <div className="rounded-lg border border-[var(--surface-glass-border)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--surface-panel)_88%,transparent),color-mix(in_srgb,var(--surface-panel-strong)_74%,transparent))] p-4 shadow-sm">
      <dt className="text-xs font-semibold uppercase text-primary-gray">
        {label}
      </dt>
      <dd className="mt-2 break-words font-display text-2xl font-black leading-none text-primary-white">
        {value}
      </dd>
      <p className="mt-2 line-clamp-2 text-xs font-medium leading-relaxed text-primary-gray">
        {detail}
      </p>
    </div>
  );
}

function AuthorPortrait({
  author,
  canShowImage,
  imageSrc,
  onImageError,
}: {
  author: Author;
  canShowImage: boolean;
  imageSrc: string | null;
  onImageError: () => void;
}): ReactElement {
  return (
    <figure className="mx-auto w-full max-w-[320px] lg:mx-0">
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-[var(--surface-glass-border)] bg-secondary-black shadow-lg">
        {canShowImage ? (
          <img
            src={imageSrc ?? undefined}
            alt={`Portrait of ${author.name}`}
            className="h-full w-full object-cover"
            width="640"
            height="800"
            loading="eager"
            decoding="async"
            onError={onImageError}
          />
        ) : (
          <div
            className="fallback-gradient flex h-full w-full items-center justify-center px-8 text-center text-6xl font-black text-primary-white"
            style={getFallbackHueStyle(author.name)}
          >
            <span aria-hidden="true">{getInitials(author.name)}</span>
            <span className="sr-only">Portrait unavailable for {author.name}</span>
          </div>
        )}
      </div>
    </figure>
  );
}

export function AuthorHero({
  author,
  books,
  isLiked,
  isLikePending,
  onToggleLike,
}: AuthorHeroProps): ReactElement {
  const [hasImageError, setHasImageError] = useState(false);
  const imageSrc = getAuthorImage(author);
  const canShowImage = Boolean(imageSrc) && !hasImageError;
  const averageRating = useMemo(() => getAverageRating(books), [books]);
  const topGenres = useMemo(() => getTopGenres(books), [books]);
  const bookCount = author.books_count ?? books.length;
  const likeCount = author.like_count ?? 0;
  const timeline = getAuthorTimeline(author);
  const summary =
    author.bio?.trim() ||
    "This author profile is ready for catalog details, books, and reader signals as the BookNest library grows.";
  const heroSummary =
    summary.length > 240 ? `${summary.slice(0, 237).trim()}...` : summary;
  const primaryGenre = topGenres[0] ?? "Varied";
  const secondaryGenres = topGenres.slice(1).join(" / ");
  const stats: AuthorStat[] = [
    {
      label: "Books",
      value: formatCompactNumber(bookCount),
      detail: pluralize(bookCount, "title"),
    },
    {
      label: "Favorites",
      value: formatCompactNumber(likeCount),
      detail: pluralize(likeCount, "reader"),
    },
    {
      label: "Avg rating",
      value: averageRating === null ? "New" : averageRating.toFixed(1),
      detail: averageRating === null ? "Awaiting ratings" : "Across listed books",
    },
    {
      label: "Focus",
      value: primaryGenre,
      detail: secondaryGenres || timeline || "Catalog range",
    },
  ];

  return (
    <section
      className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden py-8 sm:py-12"
      aria-labelledby="author-title"
    >
      {canShowImage ? (
        <img
          src={imageSrc ?? undefined}
          alt=""
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-15 blur-3xl"
          aria-hidden="true"
        />
      ) : null}
      <div
        className="absolute inset-0 bg-gradient-to-b from-primary-black/20 via-primary-black/80 to-primary-black"
        aria-hidden="true"
      />
      <div className="container relative grid gap-8 lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)] lg:items-center">
        <AuthorPortrait
          author={author}
          canShowImage={canShowImage}
          imageSrc={imageSrc}
          onImageError={() => setHasImageError(true)}
        />

        <div className="min-w-0">
          <nav
            className="mb-5 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase text-primary-gray"
            aria-label="Breadcrumb"
          >
            <Link to={routePaths.authors} className="hover:text-accent">
              Authors
            </Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Profile</span>
          </nav>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[var(--surface-glass-border)] bg-primary-black/45 px-3 py-1 text-xs font-bold uppercase text-accent shadow-sm backdrop-blur">
              Author profile
            </span>
            {timeline ? (
              <span className="rounded-full border border-[var(--surface-glass-border)] bg-primary-black/35 px-3 py-1 text-xs font-semibold text-primary-gray">
                {timeline}
              </span>
            ) : null}
          </div>

          <h1 id="author-title" className="display-heading max-w-4xl">
            {author.name}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-primary-gray sm:text-lg">
            {heroSummary}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={onToggleLike}
              disabled={isLikePending}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2 text-sm font-bold text-accent-contrast shadow-glow hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              aria-pressed={isLiked}
              aria-label={`${isLiked ? "Remove" : "Add"} ${author.name} ${isLiked ? "from" : "to"} favorite authors`}
              aria-busy={isLikePending}
            >
              {isLikePending ? (
                <InlineSpinner className="h-4 w-4" />
              ) : (
                <HeartIcon isFilled={isLiked} />
              )}
              {isLikePending ? "Saving" : isLiked ? "Favorited" : "Favorite"}
            </button>
            <a
              href="#author-books"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-[var(--surface-glass-border)] bg-primary-black/30 px-5 py-2 text-sm font-bold text-primary-white hover:border-accent hover:text-accent"
            >
              View books
              <ArrowRightIcon />
            </a>
            <Link
              to={routeBuilders.searchQuery(author.name)}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg px-5 py-2 text-sm font-bold text-primary-gray hover:bg-secondary-black hover:text-primary-white"
            >
              Search catalog
            </Link>
          </div>

          <dl className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <AuthorStatCard key={stat.label} {...stat} />
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

export function AuthorBio({ author }: AuthorBioProps): ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);
  const bio = author.bio?.trim();
  const text = bio || "No biography is available for this author yet.";
  const shouldClamp = text.length > 640;
  const timeline = getAuthorTimeline(author);
  const details: AuthorDetail[] = [
    timeline ? { label: "Timeline", value: timeline } : null,
    author.source ? { label: "Source", value: author.source } : null,
    formatDate(author.created_at)
      ? { label: "Added", value: formatDate(author.created_at) ?? "" }
      : null,
    formatDate(author.updated_at)
      ? { label: "Updated", value: formatDate(author.updated_at) ?? "" }
      : null,
  ].filter((detail): detail is AuthorDetail => Boolean(detail));

  return (
    <section
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
      aria-labelledby="author-bio-title"
    >
      <div className="min-w-0">
        <div className="mb-4 flex items-center gap-3">
          <span className="h-px w-10 bg-accent" aria-hidden="true" />
          <h2 id="author-bio-title" className="text-xl font-bold text-primary-white sm:text-2xl">
            Biography
          </h2>
        </div>
        <p
          className={`max-w-4xl text-base leading-8 text-primary-gray ${
            shouldClamp && !isExpanded ? "line-clamp-6" : ""
          }`}
        >
          {text}
        </p>
        {shouldClamp ? (
          <button
            type="button"
            className="mt-4 inline-flex min-h-[40px] items-center rounded-lg px-0 text-sm font-bold text-accent hover:text-primary-white"
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded((current) => !current)}
          >
            {isExpanded ? "Show less" : "Read full bio"}
          </button>
        ) : null}
      </div>

      {details.length > 0 ? (
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {details.map((detail) => (
            <div
              key={detail.label}
              className="rounded-lg border border-[var(--surface-glass-border)] bg-secondary-black/60 p-4"
            >
              <dt className="text-xs font-semibold uppercase text-primary-gray">
                {detail.label}
              </dt>
              <dd className="mt-1 break-words text-sm font-bold text-primary-white">
                {detail.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}

export function AuthorBooks({
  author,
  books,
  isLoading,
  isFetching,
}: AuthorBooksProps): ReactElement {
  const bookCount = author.books_count ?? books.length;

  return (
    <section
      id="author-books"
      className="scroll-mt-28"
      aria-labelledby="author-books-title"
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <span className="h-px w-10 bg-accent" aria-hidden="true" />
            <h2 id="author-books-title" className="text-xl font-bold text-primary-white sm:text-2xl">
              Books by {author.name}
            </h2>
          </div>
          <p className="text-sm text-primary-gray">
            {pluralize(bookCount, "title")} available in BookNest.
          </p>
        </div>
        {isFetching && !isLoading ? (
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-primary-gray" role="status">
            <InlineSpinner />
            Updating books
          </p>
        ) : null}
      </div>

      {isLoading ? (
        <div
          className="catalog-grid"
          role="status"
          aria-live="polite"
          aria-label="Loading author books"
        >
          {skeletonBookKeys.map((key) => (
            <BookCardSkeleton key={key} showAuthor={false} />
          ))}
        </div>
      ) : null}

      {!isLoading && books.length === 0 ? (
        <EmptyState
          title="No books listed yet"
          description="This author's books will appear here when they are available."
          actionLabel="Browse books"
          actionTo={routePaths.explore}
        />
      ) : null}

      {!isLoading && books.length > 0 ? (
        <div className="catalog-grid">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              to={routeBuilders.book(book.id)}
              title={book.title}
              author={getAuthorNames(book)}
              coverSrc={book.cover || book.cover_fallback_url}
              rating={book.average_rating}
              ratingCount={book.rating_count}
              showAuthor={false}
              size="small"
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function AuthorPageSkeleton(): ReactElement {
  return (
    <div
      className="flex flex-col gap-10 pb-16 animate-fade-up"
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading author profile"
    >
      <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden py-8 sm:py-12">
        <div
          className="absolute inset-0 bg-gradient-to-b from-primary-black/20 via-primary-black/80 to-primary-black"
          aria-hidden="true"
        />
        <div className="container relative grid gap-8 lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)] lg:items-center">
          <div className="mx-auto aspect-[4/5] w-full max-w-[320px] rounded-lg animate-shimmer lg:mx-0" />
          <div className="min-w-0">
            <div className="mb-5 h-4 w-40 rounded-full animate-shimmer" />
            <div className="h-14 w-full max-w-xl rounded-full animate-shimmer" />
            <div className="mt-4 h-5 w-full max-w-2xl rounded-full animate-shimmer" />
            <div className="mt-3 h-5 w-10/12 max-w-xl rounded-full animate-shimmer" />
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="h-11 w-32 rounded-lg animate-shimmer" />
              <div className="h-11 w-32 rounded-lg animate-shimmer" />
              <div className="h-11 w-36 rounded-lg animate-shimmer" />
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {["stat-1", "stat-2", "stat-3", "stat-4"].map((key) => (
                <div key={key} className="h-28 rounded-lg animate-shimmer" />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <div className="mb-4 h-7 w-40 rounded-full animate-shimmer" />
          <div className="space-y-3">
            <div className="h-4 w-full max-w-4xl rounded-full animate-shimmer" />
            <div className="h-4 w-11/12 max-w-4xl rounded-full animate-shimmer" />
            <div className="h-4 w-9/12 max-w-3xl rounded-full animate-shimmer" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div className="h-20 rounded-lg animate-shimmer" />
          <div className="h-20 rounded-lg animate-shimmer" />
        </div>
      </section>

      <section>
        <div className="mb-5 h-7 w-52 rounded-full animate-shimmer" />
        <div className="catalog-grid">
          {skeletonBookKeys.map((key) => (
            <BookCardSkeleton key={key} showAuthor={false} />
          ))}
        </div>
      </section>
    </div>
  );
}
