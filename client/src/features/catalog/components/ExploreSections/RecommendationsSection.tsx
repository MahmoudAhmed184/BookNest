import type { ReactElement } from "react";

import { BookCard, EmptyState, ErrorState } from "../../../../components/ui";
import { routeBuilders, routePaths } from "../../../../routes/paths";
import type {
  RecommendationFeedbackType,
  UserRecommendation,
} from "../../types/book";
import { BookCarousel } from "./BookCarousel";
import { SectionTitle } from "./SectionTitle";
import { SkeletonRow } from "./SkeletonRow";

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
          keyExtractor={(recommendation) => String(recommendation.book)}
          renderBook={(recommendation) => (
            <div className="flex h-full flex-col gap-2">
              <BookCard
                to={routeBuilders.book(recommendation.book)}
                title={recommendation.book_detail?.title ?? "Recommended book"}
                coverSrc={
                  recommendation.book_detail?.cover ||
                  recommendation.book_detail?.cover_fallback_url
                }
                showAuthor={false}
                onClick={() => onRecommendationClick(recommendation.id)}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="min-h-[36px] rounded-lg border border-secondary-gray px-3 text-xs font-semibold text-primary-gray hover:border-accent hover:text-primary-white"
                  onClick={() => onFeedback(recommendation, "read")}
                >
                  Already read
                </button>
                <button
                  type="button"
                  className="min-h-[36px] rounded-lg px-3 text-xs font-semibold text-primary-gray hover:bg-primary-black hover:text-primary-white"
                  onClick={() => onDismiss(recommendation.id)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        />
      ) : null}
    </section>
  );
}
