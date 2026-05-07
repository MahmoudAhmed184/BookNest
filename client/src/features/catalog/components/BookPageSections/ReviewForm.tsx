import type { FormEvent, ReactElement } from "react";

import { InlineSpinner, StarRating } from "../../../../components/ui";

export interface ReviewFormProps {
  rating: number;
  reviewText: string;
  isSubmitting: boolean;
  isDeletingRating: boolean;
  canDeleteRating: boolean;
  submitLabel: string;
  onRatingChange: (rating: number) => void;
  onReviewTextChange: (value: string) => void;
  onDeleteRating: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function ReviewForm({
  rating,
  reviewText,
  isSubmitting,
  isDeletingRating,
  canDeleteRating,
  submitLabel,
  onRatingChange,
  onReviewTextChange,
  onDeleteRating,
  onSubmit,
}: ReviewFormProps): ReactElement {
  return (
    <section className="flex flex-col gap-5" aria-labelledby="review-form-title">
      <form onSubmit={onSubmit} className="glass-card flex flex-col gap-4 p-4 sm:p-6">
        <h2 id="review-form-title" className="text-xl font-bold text-primary-white">
          Share your review
        </h2>
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-primary-white">Your rating</legend>
          <StarRating
            value={rating}
            size="lg"
            readOnly={false}
            onChange={onRatingChange}
            label="Choose a rating"
          />
        </fieldset>
        <div className="flex flex-col gap-2">
          <label htmlFor="reviewText" className="text-sm font-medium text-primary-white">
            Review
          </label>
          <textarea
            id="reviewText"
            value={reviewText}
            onChange={(event) => onReviewTextChange(event.target.value)}
            className="field min-h-32 resize-y text-primary-white"
            placeholder="Write your review here..."
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center gap-2 px-5 py-2 text-primary-white"
          >
            {isSubmitting ? <InlineSpinner /> : null}
            {submitLabel}
          </button>
          {canDeleteRating ? (
            <button
              type="button"
              disabled={isDeletingRating}
              className="min-h-[44px] rounded-full px-5 py-2 text-sm font-semibold text-accent hover:bg-primary-black"
              onClick={onDeleteRating}
            >
              {isDeletingRating ? "Deleting..." : "Delete rating"}
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
