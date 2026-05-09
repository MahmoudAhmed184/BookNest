import type { ReactElement } from "react";

import { EmptyState, ErrorState } from "../../../../components/ui";
import type {
  BookRating,
  BookReview,
  ReviewSortBy,
  ReviewSortOrder,
  ReviewVote,
  ReviewVoteType,
} from "../../types/book";
import { ReviewCard } from "./ReviewCard";

const skeletonKeys = ["review-skeleton-1", "review-skeleton-2"];

interface GroupedReview {
  review: BookReview;
  rating: number;
}

export interface ReviewsSectionProps {
  reviews?: BookReview[] | undefined;
  ratings?: BookRating[] | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isRatingsError: boolean;
  sortBy: ReviewSortBy;
  order: ReviewSortOrder;
  currentUserId?: number | null | undefined;
  isUpdatingReview: boolean;
  isVotingReview: boolean;
  reviewVotes?: ReviewVote[] | undefined;
  onSortChange: (sortBy: ReviewSortBy, order: ReviewSortOrder) => void;
  onUpdateReview: (reviewId: string | number, reviewText: string) => void;
  onVoteReview: (reviewId: string | number, voteType: ReviewVoteType) => void;
  onDeleteReviewVote: (reviewId: string | number) => void;
  onRetry: () => void;
}

function pairReviewsWithRatings(
  reviews: BookReview[],
  ratings?: BookRating[]
): GroupedReview[] {
  return reviews.map((review, index) => ({
    review,
    rating:
      ratings?.find((rating) => rating.id === review.rating)?.value ??
      ratings?.[index]?.value ??
      0,
  }));
}

export function ReviewsSection({
  reviews,
  ratings,
  isLoading,
  isFetching,
  isError,
  isRatingsError,
  sortBy,
  order,
  currentUserId,
  isUpdatingReview,
  isVotingReview,
  reviewVotes,
  onSortChange,
  onUpdateReview,
  onVoteReview,
  onDeleteReviewVote,
  onRetry,
}: ReviewsSectionProps): ReactElement {
  const reviewItems = pairReviewsWithRatings(reviews ?? [], ratings);
  const reviewCount = reviews?.length ?? 0;

  return (
    <section className="flex flex-col gap-5" aria-labelledby="reviews-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="reviews-title" className="font-display text-3xl font-bold text-primary-white">
            Reader reviews
          </h2>
          <p className="mt-1 text-sm text-primary-gray">
            {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border border-[var(--surface-glass-border)] bg-primary-white/5 p-1" aria-label="Sort reviews">
            <button
              type="button"
              className={`min-h-[40px] rounded-full px-4 text-xs font-semibold ${sortBy === "reviewed_at" ? "bg-accent text-accent-contrast" : "text-primary-gray hover:bg-primary-white/10 hover:text-primary-white"}`}
              aria-pressed={sortBy === "reviewed_at"}
              onClick={() => onSortChange("reviewed_at", order)}
            >
              Newest
            </button>
            <button
              type="button"
              className={`min-h-[40px] rounded-full px-4 text-xs font-semibold ${sortBy === "upvote_count" ? "bg-accent text-accent-contrast" : "text-primary-gray hover:bg-primary-white/10 hover:text-primary-white"}`}
              aria-pressed={sortBy === "upvote_count"}
              onClick={() => onSortChange("upvote_count", order)}
            >
              Helpful
            </button>
          </div>
          <div className="flex rounded-full border border-[var(--surface-glass-border)] bg-primary-white/5 p-1" aria-label="Review order">
            <button
              type="button"
              className={`min-h-[40px] rounded-full px-4 text-xs font-semibold ${order === "desc" ? "bg-secondary-black text-primary-white" : "text-primary-gray hover:bg-primary-white/10 hover:text-primary-white"}`}
              aria-pressed={order === "desc"}
              onClick={() => onSortChange(sortBy, "desc")}
            >
              Desc
            </button>
            <button
              type="button"
              className={`min-h-[40px] rounded-full px-4 text-xs font-semibold ${order === "asc" ? "bg-secondary-black text-primary-white" : "text-primary-gray hover:bg-primary-white/10 hover:text-primary-white"}`}
              aria-pressed={order === "asc"}
              onClick={() => onSortChange(sortBy, "asc")}
            >
              Asc
            </button>
          </div>
          {isFetching && reviews?.length ? (
            <p className="text-xs text-primary-gray" role="status">Updating reviews...</p>
          ) : null}
        </div>
      </div>
      {isLoading ? <ReviewsSkeleton /> : null}
      {isError || isRatingsError ? (
        <ErrorState title="Reviews could not be loaded" message="We could not load reader reviews right now." onRetry={onRetry} isRetrying={isFetching} />
      ) : null}
      {!isLoading && !isError && !isRatingsError && (reviews?.length ?? 0) === 0 ? (
        <EmptyState title="No reviews yet" description="Be the first reader to leave a thoughtful note about this book." />
      ) : null}
      {!isLoading && !isError && !isRatingsError ? (
        <div className="flex flex-col gap-4">
          {reviewItems.map((item) => (
            <ReviewCard
              key={item.review.id}
              review={item.review}
              rating={item.rating}
              canEdit={Boolean(
                currentUserId !== null &&
                  currentUserId !== undefined &&
                  item.review.user === currentUserId
              )}
              isUpdating={isUpdatingReview}
              isVoting={isVotingReview}
              currentVote={
                reviewVotes?.find((vote) => vote.review === item.review.id)
                  ?.vote_type ?? null
              }
              onUpdate={onUpdateReview}
              onVote={onVoteReview}
              onDeleteVote={onDeleteReviewVote}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function ReviewsSkeleton(): ReactElement {
  return (
    <div className="flex flex-col gap-4" role="status" aria-live="polite">
      {skeletonKeys.map((key) => (
        <div key={key} className="glass-card p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-11 w-11 rounded-full animate-shimmer" />
            <div className="h-8 w-48 rounded-full animate-shimmer" />
          </div>
          <div className="h-20 rounded-xl animate-shimmer" />
        </div>
      ))}
    </div>
  );
}
