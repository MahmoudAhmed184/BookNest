import type { ReactElement } from "react";

import { EmptyState, ErrorState } from "../../../../components/ui";
import type { BookRating, BookReview } from "../../types/book";
import type { MoodTag } from "../../types/filters";
import { ReviewCard, getReviewMood } from "./ReviewCard";

const skeletonKeys = ["review-skeleton-1", "review-skeleton-2"];
const moodOrder: MoodTag[] = ["adventurous", "emotional", "dark", "funny", "hopeful"];

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
  onRetry: () => void;
}

function groupReviews(reviews: BookReview[], ratings?: BookRating[]): Record<MoodTag, GroupedReview[]> {
  const grouped: Record<MoodTag, GroupedReview[]> = {
    adventurous: [],
    emotional: [],
    dark: [],
    funny: [],
    hopeful: [],
  };

  reviews.forEach((review, index) => {
    const mood = getReviewMood(review);
    grouped[mood].push({ review, rating: ratings?.[index]?.rate ?? 0 });
  });

  return grouped;
}

function labelize(value: string): string {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

export function ReviewsSection({
  reviews,
  ratings,
  isLoading,
  isFetching,
  isError,
  isRatingsError,
  onRetry,
}: ReviewsSectionProps): ReactElement {
  const grouped = groupReviews(reviews ?? [], ratings);

  return (
    <section className="flex flex-col gap-5" aria-labelledby="reviews-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="reviews-title" className="text-xl font-bold text-primary-white">Reader Reviews</h2>
        {isFetching && reviews?.length ? (
          <p className="text-xs text-primary-gray" role="status">Updating reviews...</p>
        ) : null}
      </div>
      {isLoading ? <ReviewsSkeleton /> : null}
      {isError || isRatingsError ? (
        <ErrorState title="Reviews could not be loaded" message="We could not load reader reviews right now." onRetry={onRetry} isRetrying={isFetching} />
      ) : null}
      {!isLoading && !isError && !isRatingsError && (reviews?.length ?? 0) === 0 ? (
        <EmptyState title="No reviews yet" description="Be the first reader to leave a thoughtful note about this book." />
      ) : null}
      {!isLoading && !isError && !isRatingsError ? (
        <div className="flex flex-col gap-6">
          {moodOrder.map((mood) =>
            grouped[mood].length > 0 ? (
              <section key={mood} className="flex flex-col gap-3" aria-label={`${mood} reviews`}>
                <h3 className="text-sm font-bold uppercase text-primary-gray">{labelize(mood)}</h3>
                {grouped[mood].map((item) => (
                  <ReviewCard key={item.review.review_id} review={item.review} rating={item.rating} mood={mood} />
                ))}
              </section>
            ) : null
          )}
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
