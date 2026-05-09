import type { ReactElement } from "react";

import { EmptyState, ErrorState } from "../../../../components/ui";
import type { BookRating, BookReview } from "../../../catalog/types/book";
import { ProfileReviewCard } from "./ProfileReviewCard";

const skeletonKeys = ["profile-review-1", "profile-review-2"];

export interface ProfileReviewsSectionProps {
  title: string;
  reviews?: BookReview[] | undefined;
  ratings?: BookRating[] | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isRatingsError: boolean;
  emptyTitle: string;
  emptyDescription: string;
  emptyActionLabel?: string | undefined;
  emptyActionTo?: string | undefined;
  canDelete?: boolean | undefined;
  isDeleting?: boolean | undefined;
  onRetry: () => void;
  onDeleteReview?: ((review: BookReview) => void) | undefined;
}

export function ProfileReviewsSection({
  title,
  reviews,
  ratings,
  isLoading,
  isFetching,
  isError,
  isRatingsError,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  emptyActionTo,
  canDelete = false,
  isDeleting = false,
  onRetry,
  onDeleteReview,
}: ProfileReviewsSectionProps): ReactElement {
  return (
    <section className="flex flex-col gap-5" aria-labelledby="profile-reviews-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-accent">Reader notes</p>
          <h2 id="profile-reviews-title" className="text-2xl font-bold text-primary-white">{title}</h2>
        </div>
        {isFetching && reviews?.length ? (
          <p className="rounded-lg border border-[var(--surface-glass-border)] px-3 py-1 text-xs font-semibold text-primary-gray" role="status">
            Updating reviews...
          </p>
        ) : null}
      </div>
      {isLoading ? <ReviewSkeleton /> : null}
      {isError || isRatingsError ? (
        <ErrorState title="Reviews could not be loaded" message="We could not load your reviews right now." onRetry={onRetry} isRetrying={isFetching} />
      ) : null}
      {!isLoading && !isError && !isRatingsError && (reviews?.length ?? 0) === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} actionLabel={emptyActionLabel} actionTo={emptyActionTo} />
      ) : null}
      {!isLoading && !isError && !isRatingsError && (reviews?.length ?? 0) > 0 ? (
        <div className="grid gap-4">
          {reviews?.map((review, index) => (
            <ProfileReviewCard
              key={review.id}
              review={review}
              rating={
                ratings?.find((rating) => rating.id === review.rating)?.value ??
                ratings?.[index]?.value ??
                0
              }
              canDelete={canDelete}
              isDeleting={isDeleting}
              onDeleteReview={onDeleteReview}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function ReviewSkeleton(): ReactElement {
  return (
    <div className="flex flex-col gap-4" role="status" aria-live="polite">
      {skeletonKeys.map((key) => (
        <div key={key} className="h-44 rounded-lg animate-shimmer" />
      ))}
    </div>
  );
}
