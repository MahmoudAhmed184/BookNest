import type { ReactElement } from "react";
import { Link } from "react-router-dom";

import { InlineSpinner, StarRating } from "../../../../components/ui";
import { routeBuilders } from "../../../../routes/paths";
import type { BookReview } from "../../../catalog/types/book";
import { ReviewCover } from "./ReviewCover";

export interface ProfileReviewCardProps {
  review: BookReview;
  rating: number;
  canDelete: boolean;
  isDeleting: boolean;
  onDeleteReview?: ((review: BookReview) => void) | undefined;
}

export function ProfileReviewCard({
  review,
  rating,
  canDelete,
  isDeleting,
  onDeleteReview,
}: ProfileReviewCardProps): ReactElement {
  const cover = <ReviewCover src={review.book_cover} title={review.book_title} />;

  return (
    <article className="glass-card card-lift p-4 text-primary-white">
      <div className="flex flex-col gap-4 sm:flex-row">
        {review.book ? (
          <Link to={routeBuilders.book(review.book)} className="shrink-0">
            {cover}
          </Link>
        ) : (
          <div className="shrink-0">{cover}</div>
        )}
        <div className="flex grow flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <strong className="line-clamp-2 text-lg" title={review.book_title || undefined}>
              {review.book_title || "Untitled book"}
            </strong>
            <StarRating value={rating} size="sm" label={`Reader rating ${rating} out of 5`} />
          </div>
          <p className="text-sm leading-relaxed">{review.review_text}</p>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 text-xs text-primary-gray">
            <span>{review.created_at}</span>
            {canDelete && onDeleteReview ? (
              <button
                type="button"
                onClick={() => onDeleteReview(review)}
                className="inline-flex min-h-[44px] items-center justify-center rounded-full px-3 py-2 font-medium text-primary-white hover:bg-primary-black"
                aria-label={`Delete review for ${review.book_title || "book"}`}
                disabled={isDeleting}
              >
                {isDeleting ? <InlineSpinner /> : "Delete"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
