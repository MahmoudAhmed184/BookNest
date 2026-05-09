import type { ReactElement } from "react";
import { Link } from "react-router-dom";

import { InlineSpinner, StarRating } from "../../../../components/ui";
import { routeBuilders } from "../../../../routes/paths";
import type { BookReview } from "../../../catalog/types/book";
import { formatActivityDate } from "../../utils/profileDisplay";
import { ReviewCover } from "./ReviewCover";

export interface ProfileReviewCardProps {
  review: BookReview;
  rating: number;
  canDelete: boolean;
  isDeleting: boolean;
  onDeleteReview?: ((review: BookReview) => void) | undefined;
}

function TrashIcon(): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}

export function ProfileReviewCard({
  review,
  rating,
  canDelete,
  isDeleting,
  onDeleteReview,
}: ProfileReviewCardProps): ReactElement {
  const book = review.book_detail;
  const reviewDate = formatActivityDate(review.reviewed_at ?? review.created_at);
  const cover = (
    <ReviewCover
      src={book?.cover || book?.cover_fallback_url}
      title={book?.title}
    />
  );

  return (
    <article className="rounded-lg border border-[var(--surface-glass-border)] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--surface-panel)_90%,transparent),color-mix(in_srgb,var(--surface-panel-strong)_76%,transparent))] p-3 text-primary-white shadow-md transition duration-200 ease-out hover:-translate-y-1 hover:shadow-lg sm:p-4">
      <div className="flex min-w-0 gap-4">
        {review.book ? (
          <Link
            to={routeBuilders.book(review.book)}
            className="w-28 shrink-0 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {cover}
          </Link>
        ) : (
          <div className="w-28 shrink-0">{cover}</div>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase text-accent">
                {reviewDate ? `Reviewed ${reviewDate}` : "Review"}
              </p>
              <strong className="mt-1 line-clamp-2 block text-lg leading-tight text-primary-white sm:text-xl" title={book?.title}>
                {book?.title || "Untitled book"}
              </strong>
              {review.title ? (
                <p className="mt-1 line-clamp-1 text-sm font-semibold text-primary-gray">
                  {review.title}
                </p>
              ) : null}
            </div>
            <StarRating
              value={rating}
              size="sm"
              className="shrink-0"
              label={`Reader rating ${rating} out of 5`}
            />
          </div>
          {review.body ? (
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-primary-white/90">
              {review.body}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-primary-gray">
            <span>
              {review.upvote_count ?? 0} helpful
            </span>
            {canDelete && onDeleteReview ? (
              <button
                type="button"
                onClick={() => onDeleteReview(review)}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-[var(--surface-glass-border)] px-3 py-2 font-semibold text-primary-white hover:border-[var(--color-error-border)] hover:bg-[var(--color-error-surface)]"
                aria-label={`Delete review for ${book?.title || "book"}`}
                disabled={isDeleting}
              >
                {isDeleting ? <InlineSpinner /> : <TrashIcon />}
                Delete
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
