import type { ReactElement, ReactNode } from "react";

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
const compactNumberFormatter = new Intl.NumberFormat("en", {
  maximumFractionDigits: 1,
  notation: "compact",
});
const sortOptions = [
  { label: "Recent", value: "reviewed_at" },
  { label: "Helpful", value: "upvote_count" },
] satisfies Array<{ label: string; value: ReviewSortBy }>;

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

function formatCompactCount(value: number): string {
  return compactNumberFormatter.format(value);
}

function formatReviewCount(value: number): string {
  return `${formatCompactCount(value)} ${value === 1 ? "review" : "reviews"}`;
}

function formatAverageRating(value: number | null): string {
  if (value === null) return "No ratings";

  return `${value.toFixed(1).replace(/\.0$/, "")} / 5`;
}

function getOrderOptions(
  sortBy: ReviewSortBy
): Array<{ label: string; value: ReviewSortOrder }> {
  if (sortBy === "upvote_count") {
    return [
      { label: "Most helpful", value: "desc" },
      { label: "Least helpful", value: "asc" },
    ];
  }

  return [
    { label: "Newest first", value: "desc" },
    { label: "Oldest first", value: "asc" },
  ];
}

interface ReviewControlGroupProps {
  label: string;
  children: ReactNode;
}

function ReviewControlGroup({
  label,
  children,
}: ReviewControlGroupProps): ReactElement {
  return (
    <div className="min-w-0">
      <span className="text-[0.7rem] font-semibold uppercase text-primary-gray">
        {label}
      </span>
      <div className="mt-2 grid grid-cols-2 gap-1 rounded-lg border border-[var(--surface-glass-border)] bg-primary-black/30 p-1">
        {children}
      </div>
    </div>
  );
}

interface ReviewStatProps {
  label: string;
  value: string;
}

function ReviewStat({ label, value }: ReviewStatProps): ReactElement {
  return (
    <div className="rounded-lg border border-[var(--surface-glass-border)] bg-primary-white/5 px-4 py-3">
      <span className="block text-[0.7rem] font-semibold uppercase text-primary-gray">
        {label}
      </span>
      <span className="mt-1 block text-base font-semibold text-primary-white">
        {value}
      </span>
    </div>
  );
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
  const ratedReviewItems = reviewItems.filter((item) => item.rating > 0);
  const averageReviewRating =
    ratedReviewItems.length > 0
      ? ratedReviewItems.reduce((total, item) => total + item.rating, 0) /
        ratedReviewItems.length
      : null;
  const helpfulVoteCount =
    reviews?.reduce((total, review) => total + (review.upvote_count ?? 0), 0) ??
    0;
  const orderOptions = getOrderOptions(sortBy);

  return (
    <section
      className="flex flex-col gap-5"
      aria-busy={isFetching}
      aria-labelledby="reviews-title"
    >
      <div className="rounded-lg border border-[var(--surface-glass-border)] bg-primary-white/5 p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-accent">
              Community notes
            </p>
            <h2
              id="reviews-title"
              className="mt-2 font-display text-3xl font-bold text-primary-white"
            >
              Reader reviews
            </h2>
            <p className="mt-1 text-sm text-primary-gray">
              {formatReviewCount(reviewCount)}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[34rem]">
            <ReviewControlGroup label="Sort">
              {sortOptions.map((option) => {
                const isActive = sortBy === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`inline-flex min-h-[40px] items-center justify-center rounded-md px-3 py-2 text-sm font-semibold ${isActive ? "bg-accent text-accent-contrast shadow-sm" : "text-primary-gray hover:bg-primary-white/10 hover:text-primary-white"}`}
                    aria-pressed={isActive}
                    onClick={() => onSortChange(option.value, order)}
                  >
                    {option.label}
                  </button>
                );
              })}
            </ReviewControlGroup>

            <ReviewControlGroup label="Order">
              {orderOptions.map((option) => {
                const isActive = order === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`inline-flex min-h-[40px] items-center justify-center rounded-md px-3 py-2 text-sm font-semibold ${isActive ? "bg-secondary-black text-primary-white shadow-sm" : "text-primary-gray hover:bg-primary-white/10 hover:text-primary-white"}`}
                    aria-pressed={isActive}
                    onClick={() => onSortChange(sortBy, option.value)}
                  >
                    {option.label}
                  </button>
                );
              })}
            </ReviewControlGroup>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3" aria-label="Review summary">
          <ReviewStat label="Reviews" value={formatCompactCount(reviewCount)} />
          <ReviewStat
            label="Average"
            value={formatAverageRating(averageReviewRating)}
          />
          <ReviewStat
            label="Helpful votes"
            value={formatCompactCount(helpfulVoteCount)}
          />
        </div>

        <div className="mt-3 min-h-5" aria-live="polite">
          {isFetching && reviews?.length ? (
            <p className="inline-flex items-center gap-2 text-xs font-semibold text-primary-gray" role="status">
              <span className="h-2 w-2 rounded-full bg-accent animate-soft-pulse" aria-hidden="true" />
              Updating
            </p>
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
              canEdit={item.review.can_edit === true}
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
        <div
          key={key}
          className="rounded-lg border border-[var(--surface-glass-border)] bg-primary-white/5 p-5 shadow-sm"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-full animate-shimmer" />
            <div className="space-y-2">
              <div className="h-4 w-32 rounded-full animate-shimmer" />
              <div className="h-3 w-24 rounded-full animate-shimmer" />
            </div>
          </div>
          <div className="h-24 rounded-lg animate-shimmer" />
        </div>
      ))}
    </div>
  );
}
