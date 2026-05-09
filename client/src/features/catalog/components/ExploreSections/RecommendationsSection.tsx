import { useState, type ReactElement } from "react";
import { Link } from "react-router-dom";

import { EmptyState, StarRating } from "../../../../components/ui";
import { routeBuilders, routePaths } from "../../../../routes/paths";
import {
  getFallbackHueStyle,
  getInitials,
} from "../../../../utils/colorFromString";
import type {
  Book,
  RecommendationFeedbackType,
  UserRecommendation,
} from "../../types/book";
import { getAuthorNames, getBookGenres } from "../../utils/bookFacets";
import { BookCarousel } from "./BookCarousel";
import { SectionTitle } from "./SectionTitle";

const recommendationSkeletonKeys = [
  "recommendation-skeleton-1",
  "recommendation-skeleton-2",
  "recommendation-skeleton-3",
  "recommendation-skeleton-4",
] as const;

const recommendationSourceLabels: Record<string, string> = {
  personalized: "Personalized",
  fallback: "Popular pick",
  trending: "Trending",
  featured: "Featured",
};

interface RecommendationCoverProps {
  book: Book | undefined;
  title: string;
}

interface RecommendationCardProps {
  recommendation: UserRecommendation;
  isBusy: boolean;
  onRecommendationClick: (id: number) => void;
  onDismiss: (id: number) => void;
  onFeedback: (
    recommendation: UserRecommendation,
    feedbackType: RecommendationFeedbackType
  ) => void;
}

function normalizeRating(rating?: number | string | null): number | null {
  if (rating === null || rating === undefined || rating === "") return null;

  const value = typeof rating === "number" ? rating : Number.parseFloat(rating);
  if (!Number.isFinite(value)) return null;

  return Math.min(5, Math.max(0, value));
}

function getSourceLabel(source: string): string {
  return recommendationSourceLabels[source] ?? "Recommended";
}

function formatCountLabel(count: number | undefined, noun: string): string | null {
  if (count === undefined) return null;

  return `${count.toLocaleString()} ${count === 1 ? noun : `${noun}s`}`;
}

function formatPageCount(count?: number | null): string | null {
  if (count === undefined || count === null) return null;

  return count > 0 ? `${count.toLocaleString()} pages` : "Pages unknown";
}

function getBookMetaLabel(book: Book | undefined): string | null {
  if (!book) return null;

  const parts = [
    book.publication_year ? String(book.publication_year) : null,
    formatPageCount(book.page_count),
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" / ") : null;
}

function RecommendationCover({
  book,
  title,
}: RecommendationCoverProps): ReactElement {
  const [hasImageError, setHasImageError] = useState(false);
  const [isCoverLoaded, setIsCoverLoaded] = useState(false);
  const cover = book?.cover || book?.cover_fallback_url;
  const canShowImage = Boolean(cover) && !hasImageError;

  return (
    <div className="relative mx-auto aspect-[2/3] w-full max-w-[7.5rem] shrink-0 overflow-hidden rounded-lg bg-primary-black shadow-2xl ring-1 ring-primary-white/10 sm:max-w-[8.5rem] xl:max-w-[9rem]">
      {canShowImage ? (
        <img
          src={cover ?? undefined}
          alt={`Cover of ${title}`}
          className={`h-full w-full object-cover opacity-0 transition duration-300 group-hover:scale-[1.025] ${
            isCoverLoaded ? "opacity-100" : ""
          }`}
          width="200"
          height="300"
          loading="lazy"
          decoding="async"
          onLoad={() => setIsCoverLoaded(true)}
          onError={() => setHasImageError(true)}
        />
      ) : (
        <div
          className="fallback-gradient flex h-full w-full items-center justify-center px-4 text-center text-3xl font-extrabold text-primary-white"
          style={getFallbackHueStyle(title)}
        >
          <span aria-hidden="true">{getInitials(title)}</span>
          <span className="sr-only">Cover unavailable for {title}</span>
        </div>
      )}
    </div>
  );
}

function RecommendationCard({
  recommendation,
  isBusy,
  onRecommendationClick,
  onDismiss,
  onFeedback,
}: RecommendationCardProps): ReactElement {
  const book = recommendation.book_detail;
  const title = book?.title?.trim() || "Recommended book";
  const author = book ? getAuthorNames(book) : "";
  const genre = book ? getBookGenres(book)[0] : null;
  const rating = normalizeRating(book?.average_rating);
  const ratingCountLabel = formatCountLabel(book?.rating_count ?? 0, "rating");
  const sourceLabel = getSourceLabel(recommendation.source);
  const bookPath = routeBuilders.book(recommendation.book);
  const metaLabel = getBookMetaLabel(book);

  return (
    <article className="card-lift flex h-full min-h-[16rem] flex-col overflow-hidden rounded-lg border border-[var(--surface-glass-border)] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--surface-panel)_92%,transparent),color-mix(in_srgb,var(--surface-panel-strong)_84%,transparent))] shadow-[0_18px_48px_color-mix(in_srgb,var(--color-primary-black)_34%,transparent)] [-webkit-tap-highlight-color:transparent] sm:min-h-[22rem]">
      <Link
        to={bookPath}
        className="group grid flex-1 grid-cols-[6.5rem_minmax(0,1fr)] gap-3 p-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent sm:flex sm:flex-col sm:p-4"
        aria-label={`Open ${title}${author ? ` by ${author}` : ""}`}
        onClick={() => onRecommendationClick(recommendation.id)}
      >
        <RecommendationCover book={book} title={title} />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accent/95 px-2.5 py-1 text-[0.6875rem] font-bold uppercase leading-none text-primary-black">
              {sourceLabel}
            </span>
            {genre ? (
              <span className="rounded-full border border-secondary-gray/80 px-2.5 py-1 text-[0.6875rem] font-semibold leading-none text-accent">
                {genre}
              </span>
            ) : null}
          </div>
          <h3 className="book-title line-clamp-2 text-base" title={title}>
            {title}
          </h3>
          {author ? (
            <p className="mt-1.5 line-clamp-1 text-xs font-medium text-primary-gray sm:text-sm" title={author}>
              {author}
            </p>
          ) : null}
          <div className="mt-2 flex items-center justify-between gap-3">
            {rating !== null ? (
              <StarRating value={rating} size="sm" />
            ) : (
              <span className="text-xs font-medium text-primary-gray">
                No rating yet
              </span>
            )}
            <span className="shrink-0 text-xs font-bold text-primary-gray">
              {ratingCountLabel}
            </span>
          </div>
          {metaLabel ? (
            <p className="mt-auto hidden pt-3 text-xs font-medium text-primary-gray sm:block">
              {metaLabel}
            </p>
          ) : null}
        </div>
      </Link>
      <div className="grid grid-cols-2 gap-2 border-t border-secondary-gray/60 p-2.5">
        <button
          type="button"
          className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-secondary-gray px-3 text-center text-xs font-bold text-primary-white transition hover:border-accent hover:bg-primary-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isBusy}
          aria-label={`Mark ${title} as already read`}
          onClick={() => onFeedback(recommendation, "read")}
        >
          Already read
        </button>
        <button
          type="button"
          className="inline-flex min-h-[40px] items-center justify-center rounded-lg px-3 text-center text-xs font-bold text-primary-gray transition hover:bg-primary-black hover:text-primary-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isBusy}
          aria-label={`Dismiss ${title}`}
          onClick={() => onDismiss(recommendation.id)}
        >
          Dismiss
        </button>
      </div>
    </article>
  );
}

function RecommendationSkeletonRow(): ReactElement {
  return (
    <div
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
      role="status"
      aria-live="polite"
    >
      {recommendationSkeletonKeys.map((key) => (
        <div
          key={key}
          className="flex min-h-[16rem] flex-col overflow-hidden rounded-lg border border-[var(--surface-glass-border)] bg-secondary-black/70 p-3 sm:min-h-[22rem] sm:p-4"
        >
          <div className="mx-auto aspect-[2/3] w-full max-w-[7.5rem] rounded-lg animate-shimmer sm:max-w-[8.5rem] xl:max-w-[9rem]" />
          <div className="mt-4 flex flex-1 flex-col gap-3">
            <div className="h-5 w-28 rounded-full animate-shimmer" />
            <div className="h-5 w-full rounded-full animate-shimmer" />
            <div className="h-5 w-3/4 rounded-full animate-shimmer" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="h-11 rounded-lg animate-shimmer" />
            <div className="h-11 rounded-lg animate-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

export interface RecommendationsSectionProps {
  recommendations: UserRecommendation[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isRefreshing: boolean;
  canRefresh: boolean;
  onRetry: () => void;
  onRefresh: () => void;
  onRecommendationClick: (id: number) => void;
  onDismiss: (id: number) => void;
  onFeedback: (
    recommendation: UserRecommendation,
    feedbackType: RecommendationFeedbackType
  ) => void;
}

export function RecommendationsSection({
  recommendations,
  isLoading,
  isFetching,
  isError,
  isRefreshing,
  canRefresh,
  onRetry,
  onRefresh,
  onRecommendationClick,
  onDismiss,
  onFeedback,
}: RecommendationsSectionProps): ReactElement {
  return (
    <section className="flex flex-col gap-5" aria-labelledby="recommended-books">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionTitle id="recommended-books">Recommended For You</SectionTitle>
        <div className="flex flex-wrap items-center gap-3">
          {isFetching && recommendations.length > 0 ? (
            <p className="text-xs text-primary-gray" role="status">Updating recommendations...</p>
          ) : null}
          <button
            type="button"
            className="btn btn-primary-v inline-flex min-h-[40px] items-center justify-center px-4 py-2 text-sm font-semibold disabled:opacity-50"
            disabled={!canRefresh || isRefreshing}
            onClick={onRefresh}
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>
      {isLoading ? <RecommendationSkeletonRow /> : null}
      {isError ? (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-secondary-gray/70 bg-secondary-black/70 p-4"
          role="alert"
        >
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-bold text-primary-white">
              Recommendations are unavailable
            </h3>
            <p className="text-sm text-primary-gray">
              We could not load your recommendations right now.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-accent-v inline-flex min-h-[40px] items-center justify-center px-4 py-2 text-sm"
            disabled={isFetching}
            onClick={onRetry}
          >
            {isFetching ? "Trying again..." : "Try again"}
          </button>
        </div>
      ) : null}
      {!isLoading && !isError && recommendations.length === 0 ? (
        <EmptyState
          title="Recommendations are warming up"
          description="Rate a few books to unlock personalized recommendations. Until then, BookNest falls back to catalog popularity and related genres."
          actionLabel="Browse books"
          actionTo={routePaths.search}
        />
      ) : null}
      {!isLoading && !isError && recommendations.length > 0 ? (
        <BookCarousel
          items={recommendations}
          keyExtractor={(recommendation) => String(recommendation.book)}
          renderBook={(recommendation) => (
            <RecommendationCard
              recommendation={recommendation}
              isBusy={isRefreshing}
              onRecommendationClick={onRecommendationClick}
              onDismiss={onDismiss}
              onFeedback={onFeedback}
            />
          )}
        />
      ) : null}
    </section>
  );
}
