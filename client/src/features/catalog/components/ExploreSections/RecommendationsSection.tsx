import type { ReactElement } from "react";

import { BookCard, EmptyState, ErrorState } from "../../../../components/ui";
import { routeBuilders, routePaths } from "../../../../routes/paths";
import type { RecommendedBook } from "../../types/book";
import { BookCarousel } from "./BookCarousel";
import { SectionTitle } from "./SectionTitle";
import { SkeletonRow } from "./SkeletonRow";

export interface RecommendationsSectionProps {
  recommendations: RecommendedBook[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isRefreshing: boolean;
  canRefresh: boolean;
  onRetry: () => void;
  onRefresh: () => void;
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
      {isLoading ? <SkeletonRow /> : null}
      {isError ? (
        <ErrorState title="Recommendations are unavailable" message="We could not load your recommendations right now." onRetry={onRetry} isRetrying={isFetching} />
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
          keyExtractor={(book) => book.book}
          renderBook={(book) => (
            <BookCard
              to={routeBuilders.book(book.book)}
              title={book.book_title}
              coverSrc={book.book_cover}
              showAuthor={false}
            />
          )}
        />
      ) : null}
    </section>
  );
}
