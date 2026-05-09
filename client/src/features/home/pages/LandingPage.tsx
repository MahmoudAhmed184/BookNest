import {
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

import {
  BookCard,
  BookCardSkeleton,
  EmptyState,
  ErrorState,
  StarRating,
} from "../../../components/ui";
import { routeBuilders, routePaths } from "../../../routes/paths";
import {
  getFallbackHueStyle,
  getInitials,
} from "../../../utils/colorFromString";
import type { AuthenticatedUser } from "../../auth/types/auth";
import { useOptionalAuth } from "../../auth/hooks/useOptionalAuth";
import { getUserDisplayName } from "../../profile/utils/profileDisplay";
import {
  BookCarousel,
  RecommendationsSection,
  SkeletonRow,
} from "../../catalog/components/ExploreSections";
import { catalogKeys } from "../../catalog/hooks/catalog.keys";
import { useLandingCatalog } from "../../catalog/hooks/useLandingCatalog";
import {
  clickRecommendation,
  createRecommendationFeedback,
  dismissRecommendation,
  getGenreBooks,
  getGenres,
  getNewReleaseBooks,
  getPopularBooks,
  getRecommendedBooks,
} from "../../catalog/services/bookService";
import type {
  Book,
  CatalogGenre,
  RecommendationFeedbackType,
  UserRecommendation,
} from "../../catalog/types/book";
import {
  getAuthorNames,
  getBookGenres,
} from "../../catalog/utils/bookFacets";

const landingBookSkeletonKeys = [
  "landing-book-1",
  "landing-book-2",
  "landing-book-3",
  "landing-book-4",
  "landing-book-5",
  "landing-book-6",
  "landing-book-7",
  "landing-book-8",
] as const;

const guestPreviewBookLimit = 8;
const guestNewReleaseLimit = 6;
const guestGenreLimit = 8;
const landingPreviewBookLimit = 8;
const landingRecommendationLimit = 12;
const landingGenrePreviewLimit = 8;
const landingGenreShelfLimit = 4;
const landingGenreShelfBookLimit = 4;

const guestValueCards = [
  {
    id: "catalog",
    title: "Catalog with reader context",
    copy:
      "Search the public catalog with ratings, genres, authors, and publication signals kept close to every book.",
    icon: "search",
  },
  {
    id: "collections",
    title: "Shelves that stay useful",
    copy:
      "Turn discovery into collections, reading plans, and book lists that stay connected to the wider catalog.",
    icon: "collection",
  },
  {
    id: "community",
    title: "Community signals",
    copy:
      "Use reviews, ratings, follows, and recommendations to find books with a reason to open them.",
    icon: "review",
  },
] as const;

const signedInActions = [
  {
    id: "search",
    title: "Search catalog",
    copy: "Find a book, author, genre, or ISBN.",
    to: routePaths.search,
    icon: "search",
  },
  {
    id: "collections",
    title: "Collections",
    copy: "Open your reading shelves.",
    to: routePaths.collections,
    icon: "collection",
  },
  {
    id: "feed",
    title: "Reader feed",
    copy: "See activity from readers you follow.",
    to: routePaths.feed,
    icon: "feed",
  },
  {
    id: "settings",
    title: "Preferences",
    copy: "Tune your profile and reading interests.",
    to: routePaths.settings,
    icon: "spark",
  },
] as const;

type LandingIconName =
  | "arrow"
  | "book"
  | "collection"
  | "feed"
  | "genre"
  | "review"
  | "search"
  | "spark";

type MetricTone = "accent" | "info" | "success" | "warning";

const metricToneClasses: Record<MetricTone, string> = {
  accent: "border-accent/40 bg-accent/10 text-accent",
  info: "border-info/35 bg-info/10 text-info",
  success: "border-success/35 bg-success/10 text-success",
  warning: "border-warning/35 bg-warning/10 text-warning",
};

interface LandingIconProps {
  name: LandingIconName;
  className?: string | undefined;
}

function LandingIcon({
  name,
  className = "h-5 w-5",
}: LandingIconProps): ReactElement {
  if (name === "arrow") {
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
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    );
  }

  if (name === "book") {
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
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      </svg>
    );
  }

  if (name === "collection") {
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
        <path d="M5 4h14" />
        <path d="M7 8h10" />
        <path d="M8 12h8" />
        <path d="M6 16h12v4H6z" />
      </svg>
    );
  }

  if (name === "feed") {
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
        <path d="M4 5h16" />
        <path d="M4 12h10" />
        <path d="M4 19h7" />
        <path d="M17 15v6" />
        <path d="M14 18h6" />
      </svg>
    );
  }

  if (name === "genre") {
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
        <path d="M4 4h7v7H4z" />
        <path d="M13 4h7v7h-7z" />
        <path d="M4 13h7v7H4z" />
        <path d="M13 13h7v7h-7z" />
      </svg>
    );
  }

  if (name === "review") {
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
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
        <path d="m8 9 2 2 4-4" />
      </svg>
    );
  }

  if (name === "search") {
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
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    );
  }

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
      <path d="m12 3 1.6 5.2L19 10l-5.4 1.8L12 17l-1.6-5.2L5 10l5.4-1.8z" />
      <path d="m19 17 .7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7z" />
      <path d="m5 15 .7 2.3L8 18l-2.3.7L5 21l-.7-2.3L2 18l2.3-.7z" />
    </svg>
  );
}

function genreBooksPath(genre: CatalogGenre): string {
  return `${routeBuilders.genreBooks(genre.id)}?name=${encodeURIComponent(
    genre.name
  )}&page=1`;
}

function numericValue(value?: number | string | null): number {
  if (value === null || value === undefined || value === "") return 0;

  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatBookCount(count?: number): string | null {
  if (count === undefined) return null;
  return `${count.toLocaleString()} ${count === 1 ? "book" : "books"}`;
}

function getReaderName(authUser?: AuthenticatedUser | null): string {
  return getUserDisplayName(authUser, "reader");
}

function getCover(book: Book): string | null | undefined {
  return book.cover || book.cover_fallback_url;
}

function getBookMeta(book: Book): string {
  const parts = [
    book.publication_year ? String(book.publication_year) : null,
    book.page_count ? `${book.page_count.toLocaleString()} pages` : null,
    getBookGenres(book)[0] ?? null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" / ") : "Catalog pick";
}

function getRatingValue(rating?: number | string | null): number | null {
  if (rating === null || rating === undefined || rating === "") return null;

  const value = typeof rating === "number" ? rating : Number.parseFloat(rating);
  if (!Number.isFinite(value)) return null;

  return Math.min(5, Math.max(0, value));
}

interface ActionLinkProps {
  to: string;
  label: string;
  variant?: "primary" | "secondary" | "quiet" | undefined;
  icon?: LandingIconName | undefined;
}

function ActionLink({
  to,
  label,
  variant = "secondary",
  icon,
}: ActionLinkProps): ReactElement {
  const variantClasses = {
    primary:
      "bg-accent text-primary-black shadow-md hover:bg-primary-white hover:shadow-lg",
    secondary:
      "border border-secondary-gray/70 bg-secondary-black/75 text-primary-white hover:border-accent hover:bg-primary-black",
    quiet: "text-primary-gray hover:bg-secondary-black hover:text-primary-white",
  }[variant];

  return (
    <Link
      to={to}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-5 py-2 text-sm font-bold ${variantClasses}`}
    >
      {icon ? <LandingIcon name={icon} className="h-4 w-4" /> : null}
      <span>{label}</span>
    </Link>
  );
}

interface SectionAction {
  to: string;
  label: string;
}

interface SectionHeaderProps {
  id: string;
  eyebrow?: string | undefined;
  title: string;
  description?: string | undefined;
  action?: SectionAction | undefined;
}

function SectionHeader({
  id,
  eyebrow,
  title,
  description,
  action,
}: SectionHeaderProps): ReactElement {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex max-w-2xl flex-col gap-2">
        {eyebrow ? (
          <p className="text-xs font-bold uppercase text-accent">{eyebrow}</p>
        ) : null}
        <h2 id={id} className="text-2xl font-bold text-primary-white text-balance">
          {title}
        </h2>
        {description ? (
          <p className="text-sm leading-relaxed text-primary-gray">
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <ActionLink
          to={action.to}
          label={action.label}
          variant="quiet"
          icon="arrow"
        />
      ) : null}
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  detail: string;
  tone?: MetricTone | undefined;
}

function MetricCard({
  label,
  value,
  detail,
  tone = "accent",
}: MetricCardProps): ReactElement {
  return (
    <article
      className={`rounded-lg border p-4 ${metricToneClasses[tone]}`}
      aria-label={`${label}: ${value}, ${detail}`}
    >
      <p className="text-2xl font-black leading-none text-primary-white">
        {value}
      </p>
      <h3 className="mt-2 text-sm font-bold text-primary-white">{label}</h3>
      <p className="mt-1 text-xs font-medium text-primary-gray">{detail}</p>
    </article>
  );
}

interface MiniCoverProps {
  book: Book;
  className?: string | undefined;
}

function MiniCover({ book, className = "" }: MiniCoverProps): ReactElement {
  const [hasImageError, setHasImageError] = useState(false);
  const cover = getCover(book);
  const canShowImage = Boolean(cover) && !hasImageError;

  if (!canShowImage) {
    return (
      <div
        className={`fallback-gradient flex items-center justify-center text-center text-sm font-black text-primary-white ${className}`}
        style={getFallbackHueStyle(book.title)}
      >
        <span aria-hidden="true">{getInitials(book.title)}</span>
        <span className="sr-only">Cover unavailable for {book.title}</span>
      </div>
    );
  }

  return (
    <img
      src={cover ?? undefined}
      alt=""
      className={`object-cover ${className}`}
      width="96"
      height="144"
      loading="lazy"
      decoding="async"
      aria-hidden="true"
      onError={() => setHasImageError(true)}
    />
  );
}

interface MiniBookTileProps {
  book: Book;
}

function MiniBookTile({ book }: MiniBookTileProps): ReactElement {
  return (
    <Link
      to={routeBuilders.book(book.id)}
      className="group min-w-0 rounded-lg border border-[var(--surface-glass-border)] bg-secondary-black/70 p-2 hover:border-accent hover:bg-primary-black"
      aria-label={`Open ${book.title}`}
    >
      <MiniCover
        book={book}
        className="aspect-[2/3] w-full rounded-md shadow-lg transition group-hover:scale-[1.02]"
      />
      <p className="mt-2 line-clamp-2 text-xs font-bold leading-tight text-primary-white">
        {book.title}
      </p>
    </Link>
  );
}

interface BookCompactRowProps {
  book: Book;
}

function BookCompactRow({ book }: BookCompactRowProps): ReactElement {
  return (
    <Link
      to={routeBuilders.book(book.id)}
      className="group grid min-h-[72px] grid-cols-[3rem_minmax(0,1fr)] gap-3 rounded-lg px-2 py-2 hover:bg-primary-black"
      aria-label={`Open ${book.title}`}
    >
      <MiniCover
        book={book}
        className="aspect-[2/3] h-16 w-12 rounded-md shadow-md"
      />
      <span className="flex min-w-0 flex-col justify-center gap-1">
        <span className="line-clamp-2 text-sm font-bold leading-tight text-primary-white group-hover:text-accent">
          {book.title}
        </span>
        <span className="line-clamp-1 text-xs font-medium text-primary-gray">
          {getAuthorNames(book) || getBookMeta(book)}
        </span>
      </span>
    </Link>
  );
}

interface PreviewPanelProps {
  title: string;
  description: string;
  children: ReactNode;
  icon: LandingIconName;
}

function PreviewPanel({
  title,
  description,
  children,
  icon,
}: PreviewPanelProps): ReactElement {
  return (
    <article className="flex min-h-[22rem] flex-col rounded-lg border border-[var(--surface-glass-border)] bg-secondary-black/70 p-4 shadow-md">
      <div className="flex items-start gap-3 border-b border-secondary-gray/45 pb-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-black text-accent">
          <LandingIcon name={icon} className="h-5 w-5" />
        </span>
        <span>
          <h3 className="text-base font-bold text-primary-white">{title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-primary-gray">
            {description}
          </p>
        </span>
      </div>
      <div className="mt-3 flex flex-1 flex-col gap-1">{children}</div>
    </article>
  );
}

interface PreviewPanelStateProps {
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  onRetry: () => void;
  emptyText: string;
  children: ReactNode;
}

function PreviewPanelState({
  isLoading,
  isError,
  isFetching,
  onRetry,
  emptyText,
  children,
}: PreviewPanelStateProps): ReactElement {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 py-2" role="status" aria-live="polite">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-[3rem_minmax(0,1fr)] gap-3 rounded-lg px-2 py-2"
          >
            <div className="aspect-[2/3] h-16 w-12 rounded-md animate-shimmer" />
            <div className="flex flex-col justify-center gap-2">
              <div className="h-4 w-full rounded-full animate-shimmer" />
              <div className="h-3 w-2/3 rounded-full animate-shimmer" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 flex-col items-start justify-center gap-3 px-2">
        <p className="text-sm text-primary-gray">This lane could not load.</p>
        <button
          type="button"
          className="inline-flex min-h-[40px] items-center rounded-lg border border-secondary-gray px-4 py-2 text-sm font-bold text-primary-white hover:border-accent hover:bg-primary-black disabled:opacity-60"
          disabled={isFetching}
          onClick={onRetry}
        >
          {isFetching ? "Trying again..." : "Try again"}
        </button>
      </div>
    );
  }

  return <>{children || <p className="p-2 text-sm text-primary-gray">{emptyText}</p>}</>;
}

interface BookPreviewPanelProps {
  title: string;
  description: string;
  books: Book[];
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  onRetry: () => void;
  icon: LandingIconName;
}

function BookPreviewPanel({
  title,
  description,
  books,
  isLoading,
  isError,
  isFetching,
  onRetry,
  icon,
}: BookPreviewPanelProps): ReactElement {
  return (
    <PreviewPanel title={title} description={description} icon={icon}>
      <PreviewPanelState
        isLoading={isLoading}
        isError={isError}
        isFetching={isFetching}
        onRetry={onRetry}
        emptyText="Books will appear here when the catalog is available."
      >
        {books.slice(0, 4).map((book) => (
          <BookCompactRow key={book.id} book={book} />
        ))}
      </PreviewPanelState>
    </PreviewPanel>
  );
}

interface GenrePreviewPanelProps {
  genres: CatalogGenre[];
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  onRetry: () => void;
}

function GenrePreviewPanel({
  genres,
  isLoading,
  isError,
  isFetching,
  onRetry,
}: GenrePreviewPanelProps): ReactElement {
  return (
    <PreviewPanel
      title="Browse by genre"
      description="Jump into the busiest catalog shelves."
      icon="genre"
    >
      <PreviewPanelState
        isLoading={isLoading}
        isError={isError}
        isFetching={isFetching}
        onRetry={onRetry}
        emptyText="Genres will appear here when the catalog is available."
      >
        <div className="flex flex-col gap-2 pt-2">
          {genres.slice(0, 6).map((genre) => {
            const countLabel = formatBookCount(genre.books_count);

            return (
              <Link
                key={genre.id}
                to={genreBooksPath(genre)}
                className="flex min-h-[48px] items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-bold text-primary-white hover:bg-primary-black hover:text-accent"
              >
                <span className="min-w-0 truncate">{genre.name}</span>
                {countLabel ? (
                  <span className="shrink-0 text-xs font-semibold text-primary-gray">
                    {countLabel}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </PreviewPanelState>
    </PreviewPanel>
  );
}

interface HeroShowcaseProps {
  books: Book[];
  featuredBook?: Book | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  onRetry: () => void;
}

function HeroShowcase({
  books,
  featuredBook,
  isLoading,
  isFetching,
  isError,
  onRetry,
}: HeroShowcaseProps): ReactElement {
  const heroBooks = [
    featuredBook,
    ...books.filter((book) => book.id !== featuredBook?.id).slice(0, 3),
  ].filter((book): book is Book => Boolean(book));

  if (isLoading) {
    return (
      <div
        className="grid gap-3 sm:grid-cols-2"
        role="status"
        aria-live="polite"
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <BookCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Featured books could not be loaded"
        message="We could not load the discovery shelf right now."
        onRetry={onRetry}
        isRetrying={isFetching}
      />
    );
  }

  if (!featuredBook || heroBooks.length === 0) {
    return (
      <EmptyState
        title="No featured books yet"
        description="Books will appear here when the catalog is available."
        actionLabel="Search books"
        actionTo={routePaths.search}
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-3 sm:hidden">
        {heroBooks.slice(0, 3).map((book) => (
          <MiniBookTile key={book.id} book={book} />
        ))}
      </div>
      <div className="hidden gap-4 sm:grid sm:grid-cols-2">
        {heroBooks.map((book, index) => (
          <BookCard
            key={book.id}
            book={book}
            to={routeBuilders.book(book.id)}
            title={book.title}
            author={getAuthorNames(book)}
            coverSrc={getCover(book)}
            rating={book.average_rating}
            ratingCount={book.rating_count}
            variant={index === 0 ? "featured" : "trending"}
            size="compact"
            className={index === 0 ? "sm:col-span-2 lg:col-span-1" : ""}
          />
        ))}
      </div>
    </>
  );
}

interface BookGridSectionProps {
  id: string;
  title: string;
  description: string;
  books: Book[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  emptyTitle: string;
  emptyDescription: string;
  onRetry: () => void;
  actionTo: string;
}

function BookGridSection({
  id,
  title,
  description,
  books,
  isLoading,
  isFetching,
  isError,
  emptyTitle,
  emptyDescription,
  onRetry,
  actionTo,
}: BookGridSectionProps): ReactElement {
  return (
    <section className="flex flex-col gap-5" aria-labelledby={id}>
      <SectionHeader
        id={id}
        title={title}
        description={description}
        action={{ to: actionTo, label: "See more" }}
      />
      {isLoading ? (
        <div className="landing-book-grid" role="status" aria-live="polite">
          {landingBookSkeletonKeys.map((key) => (
            <BookCardSkeleton key={key} />
          ))}
        </div>
      ) : null}
      {isError ? (
        <ErrorState
          title={`${title} could not be loaded`}
          message="We could not load this shelf right now."
          onRetry={onRetry}
          isRetrying={isFetching}
        />
      ) : null}
      {!isLoading && !isError && books.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          actionLabel="Explore catalog"
          actionTo={routePaths.explore}
        />
      ) : null}
      {!isLoading && !isError && books.length > 0 ? (
        <div className="landing-book-grid">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              to={routeBuilders.book(book.id)}
              title={book.title}
              author={getAuthorNames(book)}
              coverSrc={getCover(book)}
              rating={book.average_rating}
              ratingCount={book.rating_count}
              size="small"
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

interface BookRailSectionProps {
  id: string;
  eyebrow?: string | undefined;
  title: string;
  description: string;
  books: Book[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  emptyTitle: string;
  emptyDescription: string;
  onRetry: () => void;
  actionTo: string;
}

function BookRailSection({
  id,
  eyebrow,
  title,
  description,
  books,
  isLoading,
  isFetching,
  isError,
  emptyTitle,
  emptyDescription,
  onRetry,
  actionTo,
}: BookRailSectionProps): ReactElement {
  return (
    <section className="flex flex-col gap-5" aria-labelledby={id}>
      <SectionHeader
        id={id}
        eyebrow={eyebrow}
        title={title}
        description={description}
        action={{ to: actionTo, label: "See more" }}
      />
      {isLoading ? <SkeletonRow /> : null}
      {isError ? (
        <ErrorState
          title={`${title} could not be loaded`}
          message="We could not load this shelf right now."
          onRetry={onRetry}
          isRetrying={isFetching}
        />
      ) : null}
      {!isLoading && !isError && books.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          actionLabel="Explore catalog"
          actionTo={routePaths.explore}
        />
      ) : null}
      {!isLoading && !isError && books.length > 0 ? (
        <BookCarousel
          items={books}
          keyExtractor={(book) => String(book.id)}
          renderBook={(book) => (
            <BookCard
              book={book}
              to={routeBuilders.book(book.id)}
              title={book.title}
              author={getAuthorNames(book)}
              coverSrc={getCover(book)}
              rating={book.average_rating}
              ratingCount={book.rating_count}
              size="small"
            />
          )}
        />
      ) : null}
    </section>
  );
}

interface GenrePreviewGridProps {
  genres: CatalogGenre[];
}

function GenrePreviewGrid({ genres }: GenrePreviewGridProps): ReactElement {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {genres.map((genre) => {
        const countLabel = formatBookCount(genre.books_count);

        return (
          <Link
            key={genre.id}
            to={genreBooksPath(genre)}
            className="flex min-h-[76px] items-center justify-between gap-3 rounded-lg border border-secondary-gray/70 bg-secondary-black/75 px-4 py-3 text-primary-white hover:border-accent hover:bg-primary-black"
          >
            <span className="min-w-0 truncate text-base font-bold">
              {genre.name}
            </span>
            {countLabel ? (
              <span className="shrink-0 rounded-lg bg-primary-black/60 px-3 py-1 text-xs font-semibold text-primary-gray">
                {countLabel}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}

interface GenreShelfProps {
  genre: CatalogGenre;
  books: Book[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  onRetry: () => void;
}

function GenreShelf({
  genre,
  books,
  isLoading,
  isFetching,
  isError,
  onRetry,
}: GenreShelfProps): ReactElement {
  const titleId = `landing-genre-shelf-${genre.id}`;

  return (
    <article className="flex flex-col gap-4" aria-labelledby={titleId}>
      <SectionHeader
        id={titleId}
        title={genre.name}
        description="A focused shelf from this active genre."
        action={{ to: genreBooksPath(genre), label: "See more" }}
      />

      {isLoading ? (
        <div className="landing-book-grid" role="status" aria-live="polite">
          {landingBookSkeletonKeys.map((key) => (
            <BookCardSkeleton key={`${genre.id}-${key}`} />
          ))}
        </div>
      ) : null}

      {isError ? (
        <ErrorState
          title={`${genre.name} books could not be loaded`}
          message="We could not load books for this genre right now."
          onRetry={onRetry}
          isRetrying={isFetching}
        />
      ) : null}

      {!isLoading && !isError && books.length > 0 ? (
        <div className="landing-book-grid">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              to={routeBuilders.book(book.id)}
              title={book.title}
              author={getAuthorNames(book)}
              coverSrc={getCover(book)}
              rating={book.average_rating}
              ratingCount={book.rating_count}
              size="small"
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}

interface GuestLandingStatsProps {
  books: Book[];
  genres: CatalogGenre[];
}

function GuestLandingStats({
  books,
  genres,
}: GuestLandingStatsProps): ReactElement {
  const readerSignals = books.reduce(
    (total, book) => total + (book.rating_count ?? 0) + (book.review_count ?? 0),
    0
  );
  const averageRating =
    books.length > 0
      ? books.reduce((total, book) => total + numericValue(book.average_rating), 0) /
        books.length
      : 0;
  const genreCount =
    genres.length ||
    new Set(books.flatMap((book) => getBookGenres(book))).size ||
    books.length;

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <MetricCard
        label="Live shelf"
        value={formatCompactNumber(books.length)}
        detail="reader-facing picks"
        tone="accent"
      />
      <MetricCard
        label="Reader signal"
        value={formatCompactNumber(readerSignals)}
        detail="ratings and reviews"
        tone="success"
      />
      <MetricCard
        label="Discovery range"
        value={averageRating > 0 ? averageRating.toFixed(1) : String(genreCount)}
        detail={averageRating > 0 ? "average rating" : "active genres"}
        tone="info"
      />
    </div>
  );
}

function GuestLanding(): ReactElement {
  const {
    books,
    featuredBook,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useLandingCatalog();
  const newReleaseBooksQuery = useQuery({
    queryKey: catalogKeys.newReleaseBooks(guestNewReleaseLimit),
    queryFn: () => getNewReleaseBooks(guestNewReleaseLimit),
    staleTime: 60_000,
  });
  const genresQuery = useQuery({
    queryKey: catalogKeys.genres(guestGenreLimit),
    queryFn: () => getGenres(guestGenreLimit),
    staleTime: 5 * 60_000,
  });

  const popularBooks = useMemo(
    () => books.slice(0, guestPreviewBookLimit),
    [books]
  );
  const newReleaseBooks = useMemo(
    () => (newReleaseBooksQuery.data ?? []).slice(0, guestNewReleaseLimit),
    [newReleaseBooksQuery.data]
  );
  const genres = useMemo(
    () => (genresQuery.data ?? []).slice(0, guestGenreLimit),
    [genresQuery.data]
  );

  return (
    <div className="flex flex-col gap-14 py-8 animate-fade-up sm:gap-16 sm:py-10">
      <section
        className="grid gap-8 lg:min-h-[calc(100svh-14rem)] lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center"
        aria-labelledby="landing-title"
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <p className="text-xs font-bold uppercase text-accent">
              Reader-first discovery
            </p>
            <h1
              id="landing-title"
              className="font-display text-5xl font-black leading-[1.02] text-primary-white text-balance md:text-7xl"
            >
              BookNest
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-primary-gray md:text-lg">
              Discover books through live catalog signals, thoughtful shelves,
              and recommendations that keep the next read within reach.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <ActionLink
              to={routePaths.explore}
              label="Explore catalog"
              variant="primary"
              icon="search"
            />
            <ActionLink
              to={routePaths.register}
              label="Create account"
              variant="secondary"
              icon="spark"
            />
          </div>

          <GuestLandingStats books={popularBooks} genres={genres} />
        </div>

        <HeroShowcase
          books={popularBooks}
          featuredBook={featuredBook}
          isLoading={isLoading}
          isFetching={isFetching}
          isError={isError}
          onRetry={refetch}
        />
      </section>

      <section
        className="grid gap-4 lg:grid-cols-3"
        aria-labelledby="guest-discovery-lanes"
      >
        <div className="lg:col-span-3">
          <SectionHeader
            id="guest-discovery-lanes"
            eyebrow="Live catalog"
            title="Start from the shelves readers are already touching"
            description="The guest home surfaces public catalog reads only; account-specific recommendations unlock after sign in."
          />
        </div>
        <BookPreviewPanel
          title="Reader favorites"
          description="Popular public picks from catalog recommendations."
          books={popularBooks}
          isLoading={isLoading}
          isError={isError}
          isFetching={isFetching}
          onRetry={refetch}
          icon="book"
        />
        <BookPreviewPanel
          title="Fresh arrivals"
          description="Recently published or newly imported books."
          books={newReleaseBooks}
          isLoading={newReleaseBooksQuery.isLoading}
          isError={newReleaseBooksQuery.isError}
          isFetching={newReleaseBooksQuery.isFetching}
          onRetry={() => void newReleaseBooksQuery.refetch()}
          icon="spark"
        />
        <GenrePreviewPanel
          genres={genres}
          isLoading={genresQuery.isLoading}
          isError={genresQuery.isError}
          isFetching={genresQuery.isFetching}
          onRetry={() => void genresQuery.refetch()}
        />
      </section>

      <BookRailSection
        id="guest-trending"
        eyebrow="Reader momentum"
        title="Trending on BookNest"
        description="A moving shelf of public catalog books with reader activity."
        books={popularBooks}
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        emptyTitle="No trending books yet"
        emptyDescription="Trending books will appear here when catalog signals are available."
        onRetry={refetch}
        actionTo={routePaths.explore}
      />

      <section
        className="grid gap-4 md:grid-cols-3"
        aria-labelledby="guest-value-title"
      >
        <div className="md:col-span-3">
          <SectionHeader
            id="guest-value-title"
            eyebrow="Why sign in"
            title="A cleaner path from discovery to reading"
            description="BookNest keeps public discovery useful first, then adds personal shelves, feedback, and recommendations when you create an account."
          />
        </div>
        {guestValueCards.map((card) => (
          <article
            key={card.id}
            className="rounded-lg border border-[var(--surface-glass-border)] bg-secondary-black/70 p-5 shadow-md transition hover:-translate-y-1 hover:border-accent hover:shadow-lg"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary-black text-accent">
              <LandingIcon name={card.icon} className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-primary-white">
              {card.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-primary-gray">
              {card.copy}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}

interface SpotlightPanelProps {
  book?: Book | undefined;
  isLoading: boolean;
  isRefreshing: boolean;
  canRefresh: boolean;
  onRefresh: () => void;
}

function SpotlightPanel({
  book,
  isLoading,
  isRefreshing,
  canRefresh,
  onRefresh,
}: SpotlightPanelProps): ReactElement {
  if (isLoading) {
    return (
      <article
        className="grid min-h-[18rem] gap-4 rounded-lg border border-[var(--surface-glass-border)] bg-secondary-black/70 p-4 sm:grid-cols-[7rem_minmax(0,1fr)]"
        role="status"
        aria-live="polite"
      >
        <div className="aspect-[2/3] w-full max-w-28 rounded-lg animate-shimmer" />
        <div className="flex flex-col justify-center gap-3">
          <div className="h-4 w-28 rounded-full animate-shimmer" />
          <div className="h-8 w-full rounded-full animate-shimmer" />
          <div className="h-4 w-2/3 rounded-full animate-shimmer" />
          <div className="h-11 w-36 rounded-lg animate-shimmer" />
        </div>
      </article>
    );
  }

  if (!book) {
    return (
      <article className="flex min-h-[18rem] flex-col justify-center gap-4 rounded-lg border border-[var(--surface-glass-border)] bg-secondary-black/70 p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-black text-accent">
          <LandingIcon name="spark" className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-accent">Next read</p>
          <h2 className="mt-2 text-2xl font-bold text-primary-white text-balance">
            Build your recommendation shelf
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-primary-gray">
            Rate a few books or browse the catalog to give BookNest stronger
            signals for the next recommendation run.
          </p>
        </div>
        <ActionLink
          to={routePaths.explore}
          label="Browse books"
          variant="primary"
          icon="search"
        />
      </article>
    );
  }

  const rating = getRatingValue(book.average_rating);

  return (
    <article className="grid gap-4 rounded-lg border border-[var(--surface-glass-border)] bg-secondary-black/75 p-4 shadow-md sm:grid-cols-[8rem_minmax(0,1fr)] sm:p-5">
      <Link
        to={routeBuilders.book(book.id)}
        className="group mx-auto block w-full max-w-36 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:mx-0"
        aria-label={`Open ${book.title}`}
      >
        <MiniCover
          book={book}
          className="aspect-[2/3] w-full rounded-lg shadow-2xl ring-1 ring-primary-white/10 transition group-hover:scale-[1.02]"
        />
      </Link>

      <div className="flex min-w-0 flex-col justify-center gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-accent px-2.5 py-1 text-[0.6875rem] font-black uppercase leading-none text-primary-black">
            Next read
          </span>
          <span className="rounded-lg border border-secondary-gray/70 px-2.5 py-1 text-[0.6875rem] font-bold leading-none text-primary-gray">
            {getBookGenres(book)[0] ?? "Recommended"}
          </span>
        </div>

        <div>
          <h2 className="line-clamp-2 font-display text-2xl font-black leading-tight text-primary-white text-balance">
            {book.title}
          </h2>
          <p className="mt-2 line-clamp-1 text-sm font-semibold text-primary-gray">
            {getAuthorNames(book) || getBookMeta(book)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-primary-gray">
          {rating !== null ? (
            <span className="inline-flex items-center gap-2">
              <StarRating value={rating} size="sm" />
              <span>{rating.toFixed(1)}</span>
            </span>
          ) : null}
          <span>{getBookMeta(book)}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <ActionLink
            to={routeBuilders.book(book.id)}
            label="Open book"
            variant="primary"
            icon="book"
          />
          <button
            type="button"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-secondary-gray/70 bg-secondary-black/75 px-5 py-2 text-sm font-bold text-primary-white hover:border-accent hover:bg-primary-black disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!canRefresh || isRefreshing}
            onClick={onRefresh}
          >
            <LandingIcon name="spark" className="h-4 w-4" />
            <span>{isRefreshing ? "Refreshing..." : "Refresh picks"}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

interface QuickActionGridProps {
  actions: typeof signedInActions;
}

function QuickActionGrid({ actions }: QuickActionGridProps): ReactElement {
  return (
    <nav
      className="grid gap-2 sm:grid-cols-2"
      aria-label="Signed in shortcuts"
    >
      {actions.map((action) => (
        <Link
          key={action.id}
          to={action.to}
          className="group grid min-h-[72px] grid-cols-[2.5rem_minmax(0,1fr)] gap-3 rounded-lg border border-[var(--surface-glass-border)] bg-secondary-black/70 p-3 hover:border-accent hover:bg-primary-black"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-black text-accent group-hover:bg-accent group-hover:text-primary-black">
            <LandingIcon name={action.icon} className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold text-primary-white">
              {action.title}
            </span>
            <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-primary-gray">
              {action.copy}
            </span>
          </span>
        </Link>
      ))}
    </nav>
  );
}

interface AccountStatProps {
  label: string;
  value: string;
  detail: string;
  icon: LandingIconName;
  tone?: MetricTone | undefined;
}

function AccountStat({
  label,
  value,
  detail,
  icon,
  tone = "accent",
}: AccountStatProps): ReactElement {
  return (
    <article className={`rounded-lg border p-3 ${metricToneClasses[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-2xl font-black leading-none text-primary-white">
            {value}
          </p>
          <h3 className="mt-2 text-sm font-bold text-primary-white">{label}</h3>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-black/70">
          <LandingIcon name={icon} className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 text-xs font-medium text-primary-gray">{detail}</p>
    </article>
  );
}

interface SignedInLandingProps {
  token?: string | null;
  authUser?: AuthenticatedUser | null | undefined;
}

function SignedInLanding({
  token,
  authUser,
}: SignedInLandingProps): ReactElement {
  const queryClient = useQueryClient();
  const recommendationsQuery = useQuery({
    queryKey: catalogKeys.recommendations(),
    queryFn: () => getRecommendedBooks(token),
    enabled: Boolean(token),
    staleTime: 60_000,
  });
  const popularBooksQuery = useQuery({
    queryKey: catalogKeys.popularBooks(landingPreviewBookLimit),
    queryFn: () => getPopularBooks(landingPreviewBookLimit),
    staleTime: 60_000,
  });
  const newReleaseBooksQuery = useQuery({
    queryKey: catalogKeys.newReleaseBooks(landingPreviewBookLimit),
    queryFn: () => getNewReleaseBooks(landingPreviewBookLimit),
    staleTime: 60_000,
  });
  const genresQuery = useQuery({
    queryKey: catalogKeys.genres(landingGenrePreviewLimit),
    queryFn: () => getGenres(landingGenrePreviewLimit),
    staleTime: 5 * 60_000,
  });
  const recommendations = useMemo(
    () =>
      (recommendationsQuery.data ?? []).slice(0, landingRecommendationLimit),
    [recommendationsQuery.data]
  );
  const popularBooks = useMemo(
    () => (popularBooksQuery.data ?? []).slice(0, landingPreviewBookLimit),
    [popularBooksQuery.data]
  );
  const newReleaseBooks = useMemo(
    () => (newReleaseBooksQuery.data ?? []).slice(0, landingPreviewBookLimit),
    [newReleaseBooksQuery.data]
  );
  const popularGenres = useMemo(
    () => (genresQuery.data ?? []).slice(0, landingGenrePreviewLimit),
    [genresQuery.data]
  );
  const landingShelfGenres = useMemo(
    () => popularGenres.slice(0, landingGenreShelfLimit),
    [popularGenres]
  );
  const genreBookQueries = useQueries({
    queries: landingShelfGenres.map((genre) => ({
      queryKey: catalogKeys.genreBooks(
        genre.id,
        1,
        landingGenreShelfBookLimit,
        {}
      ),
      queryFn: () =>
        getGenreBooks(genre.id, {
          page: 1,
          pageSize: landingGenreShelfBookLimit,
        }),
      staleTime: 60_000,
    })),
  });

  const invalidateRecommendations = (): void => {
    void queryClient.invalidateQueries({
      queryKey: catalogKeys.recommendations(),
    });
  };
  const dismissMutation = useMutation({
    mutationFn: (id: number) => dismissRecommendation(id, token),
    onSuccess: () => {
      toast.success("Recommendation dismissed.");
      invalidateRecommendations();
    },
    onError: () => {
      toast.error("Couldn't dismiss that recommendation.");
    },
  });
  const clickMutation = useMutation({
    mutationFn: (id: number) => clickRecommendation(id, token),
    onSuccess: invalidateRecommendations,
  });
  const feedbackMutation = useMutation({
    mutationFn: ({
      recommendation,
      feedbackType,
    }: {
      recommendation: UserRecommendation;
      feedbackType: RecommendationFeedbackType;
    }) =>
      createRecommendationFeedback(
        {
          book: recommendation.book,
          recommendation: recommendation.id,
          feedback_type: feedbackType,
        },
        token
      ),
    onSuccess: () => {
      toast.success("Recommendation feedback saved.");
      invalidateRecommendations();
    },
    onError: () => {
      toast.error("Couldn't save that feedback.");
    },
  });

  const readerName = getReaderName(authUser);
  const isRefreshingRecommendations =
    recommendationsQuery.isFetching ||
    dismissMutation.isPending ||
    clickMutation.isPending ||
    feedbackMutation.isPending;
  const spotlightBook =
    recommendations.find((recommendation) => recommendation.book_detail)
      ?.book_detail ??
    newReleaseBooks[0] ??
    popularBooks[0];

  return (
    <div className="flex flex-col gap-14 py-8 animate-fade-up sm:gap-16 sm:py-10">
      <section
        className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)] xl:items-start"
        aria-labelledby="signed-in-title"
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 rounded-lg border border-[var(--surface-glass-border)] bg-secondary-black/60 p-5 shadow-md sm:p-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-black uppercase text-accent">
                Your BookNest
              </span>
              <span
                className="max-w-full truncate rounded-lg border border-secondary-gray/60 px-3 py-1.5 text-xs font-bold text-primary-gray sm:max-w-xs"
                title={readerName}
              >
                {readerName}
              </span>
            </div>
            <h1
              id="signed-in-title"
              className="font-display text-4xl font-black leading-[1.04] text-primary-white text-balance md:text-5xl"
            >
              Welcome back
            </h1>
            <p className="max-w-3xl text-base leading-relaxed text-primary-gray">
              Pick the next book, scan what changed, or jump straight into your
              reading workspace.
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <ActionLink
                to={routePaths.search}
                label="Search books"
                variant="primary"
                icon="search"
              />
              <ActionLink
                to={routePaths.collections}
                label="Open collections"
                variant="secondary"
                icon="collection"
              />
              <ActionLink
                to={routePaths.feed}
                label="Reader feed"
                variant="quiet"
                icon="feed"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <AccountStat
              label="Personal picks"
              value={formatCompactNumber(recommendations.length)}
              detail="active recommendations"
              icon="spark"
              tone="accent"
            />
            <AccountStat
              label="New releases"
              value={formatCompactNumber(newReleaseBooks.length)}
              detail="ready to scan"
              icon="book"
              tone="info"
            />
            <AccountStat
              label="Genre shelves"
              value={formatCompactNumber(popularGenres.length)}
              detail="popular right now"
              icon="genre"
              tone="success"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <SpotlightPanel
            book={spotlightBook}
            isLoading={
              recommendationsQuery.isLoading ||
              newReleaseBooksQuery.isLoading ||
              popularBooksQuery.isLoading
            }
            isRefreshing={isRefreshingRecommendations}
            canRefresh={Boolean(token)}
            onRefresh={() => void recommendationsQuery.refetch()}
          />
          <QuickActionGrid actions={signedInActions} />
        </div>
      </section>

      <RecommendationsSection
        recommendations={recommendations}
        isLoading={recommendationsQuery.isLoading}
        isFetching={recommendationsQuery.isFetching}
        isError={recommendationsQuery.isError}
        isRefreshing={isRefreshingRecommendations}
        canRefresh={Boolean(token)}
        onRetry={() => void recommendationsQuery.refetch()}
        onRefresh={() => void recommendationsQuery.refetch()}
        onRecommendationClick={(id) => clickMutation.mutate(id)}
        onDismiss={(id) => dismissMutation.mutate(id)}
        onFeedback={(recommendation, feedbackType) =>
          feedbackMutation.mutate({ recommendation, feedbackType })
        }
      />

      <BookRailSection
        id="new-releases"
        eyebrow="Fresh catalog"
        title="New releases"
        description="Recently published and newly available books from the public catalog."
        books={newReleaseBooks}
        isLoading={newReleaseBooksQuery.isLoading}
        isFetching={newReleaseBooksQuery.isFetching}
        isError={newReleaseBooksQuery.isError}
        emptyTitle="No new releases yet"
        emptyDescription="Recently published books will appear here when they are available."
        onRetry={() => void newReleaseBooksQuery.refetch()}
        actionTo={routePaths.explore}
      />

      <BookGridSection
        id="popular-this-week"
        title="Popular this week"
        description="Books carrying the strongest public catalog and recommendation signals."
        books={popularBooks}
        isLoading={popularBooksQuery.isLoading}
        isFetching={popularBooksQuery.isFetching}
        isError={popularBooksQuery.isError}
        emptyTitle="No popular books yet"
        emptyDescription="Popular books will appear here when catalog signals are available."
        onRetry={() => void popularBooksQuery.refetch()}
        actionTo={routePaths.explore}
      />

      <section className="flex flex-col gap-6" aria-labelledby="signed-in-genres">
        <SectionHeader
          id="signed-in-genres"
          eyebrow="Genre map"
          title="Popular genres"
          description="Browse the shelves with the most catalog depth right now."
          action={{ to: routePaths.genres, label: "See more" }}
        />
        {genresQuery.isLoading ? (
          <div
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
            role="status"
            aria-live="polite"
          >
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-20 rounded-lg border border-[var(--surface-glass-border)] bg-secondary-black/70 animate-shimmer"
              />
            ))}
          </div>
        ) : null}
        {genresQuery.isError ? (
          <ErrorState
            title="Genres could not be loaded"
            message="We could not load popular genres right now."
            onRetry={() => void genresQuery.refetch()}
            isRetrying={genresQuery.isFetching}
          />
        ) : null}
        {!genresQuery.isLoading &&
        !genresQuery.isError &&
        popularGenres.length === 0 ? (
          <EmptyState
            title="No popular genres yet"
            description="Genre shelves will appear here when the catalog is available."
            actionLabel="Browse genres"
            actionTo={routePaths.genres}
          />
        ) : null}
        {!genresQuery.isLoading &&
        !genresQuery.isError &&
        popularGenres.length > 0 ? (
          <GenrePreviewGrid genres={popularGenres} />
        ) : null}
      </section>

      {!genresQuery.isLoading &&
      !genresQuery.isError &&
      landingShelfGenres.length > 0 ? (
        <section className="flex flex-col gap-6" aria-labelledby="landing-genre-shelves">
          <SectionHeader
            id="landing-genre-shelves"
            eyebrow="Shelf sampler"
            title="Popular genre shelves"
            description="A few books from the busiest public genre shelves."
          />

          <div className="flex flex-col gap-10">
            {landingShelfGenres.map((genre, index) => {
              const genreBookQuery = genreBookQueries[index];
              const genreBooks = genreBookQuery?.data?.results ?? [];

              return (
                <GenreShelf
                  key={genre.id}
                  genre={genre}
                  books={genreBooks}
                  isLoading={genreBookQuery?.isLoading ?? false}
                  isFetching={genreBookQuery?.isFetching ?? false}
                  isError={genreBookQuery?.isError ?? false}
                  onRetry={() => void genreBookQuery?.refetch()}
                />
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default function Landing(): ReactElement {
  const { user, token, authUser } = useOptionalAuth();
  return user ? (
    <SignedInLanding token={token} authUser={authUser} />
  ) : (
    <GuestLanding />
  );
}
