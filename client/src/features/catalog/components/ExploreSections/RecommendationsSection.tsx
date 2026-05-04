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
  onRetry: () => void;
}

export function RecommendationsSection({
  recommendations,
  isLoading,
  isFetching,
  isError,
  onRetry,
}: RecommendationsSectionProps): ReactElement {
  return (
    <section className="flex flex-col gap-5" aria-labelledby="recommended-books">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionTitle id="recommended-books">Recommended For You</SectionTitle>
        {isFetching && recommendations.length > 0 ? (
          <p className="text-xs text-primary-gray" role="status">Updating recommendations...</p>
        ) : null}
      </div>
      {isLoading ? <SkeletonRow /> : null}
      {isError ? (
        <ErrorState title="Recommendations are unavailable" message="We could not load your recommendations right now." onRetry={onRetry} isRetrying={isFetching} />
      ) : null}
      {!isLoading && !isError && recommendations.length === 0 ? (
        <EmptyState
          title="Recommendations are warming up"
          description="Rate more books to unlock personalized recommendations that match your reading taste."
          actionLabel="Browse books"
          actionTo={routePaths.search}
        />
      ) : null}
      {!isLoading && !isError && recommendations.length > 0 ? (
        <BookCarousel
          items={recommendations}
          navigationClass="explore-recommendations"
          keyExtractor={(book) => book.book}
          renderBook={(book) => (
            <BookCard
              to={routeBuilders.book(book.book)}
              title={book.book_title}
              coverSrc={book.book_cover}
              showAuthor={false}
              variant="new"
            />
          )}
        />
      ) : null}
    </section>
  );
}
