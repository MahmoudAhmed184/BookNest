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

  return (
    <section className="flex flex-col gap-5" aria-labelledby="reviews-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="reviews-title" className="text-xl font-bold text-primary-white">Reader Reviews</h2>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-primary-gray">
            Sort
            <select
              className="field min-h-[44px] text-primary-white"
              value={sortBy}
              onChange={(event) =>
                onSortChange(event.target.value as ReviewSortBy, order)
              }
            >
              <option value="reviewed_at">Date</option>
              <option value="upvote_count">Upvotes</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-primary-gray">
            Order
            <select
              className="field min-h-[44px] text-primary-white"
              value={order}
              onChange={(event) =>
                onSortChange(sortBy, event.target.value as ReviewSortOrder)
              }
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </label>
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
        <div key={key} className="glass-card p-4">
          <div className="mb-4 h-8 w-48 rounded-full animate-shimmer" />
          <div className="h-16 rounded-xl animate-shimmer" />
        </div>
      ))}
    </div>
  );
}
