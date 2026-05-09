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
      <form onSubmit={onSubmit} className="glass-card grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Reader note
          </p>
          <h2 id="review-form-title" className="mt-2 font-display text-3xl font-bold leading-tight text-primary-white">
            Write a review
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-primary-gray">
            Share a concise take for readers deciding whether this belongs on their shelf.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-semibold text-primary-white">Your rating</legend>
            <StarRating
              value={rating}
              size="lg"
              readOnly={false}
              onChange={onRatingChange}
              label="Choose a rating"
            />
          </fieldset>
          <div className="flex flex-col gap-2">
            <label htmlFor="reviewText" className="text-sm font-semibold text-primary-white">
              Review
            </label>
            <textarea
              id="reviewText"
              value={reviewText}
              onChange={(event) => onReviewTextChange(event.target.value)}
              className="field min-h-36 resize-y rounded-xl text-primary-white"
              placeholder="What should other readers know?"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center gap-2 px-5 py-2 text-sm text-primary-white"
            >
              {isSubmitting ? <InlineSpinner /> : null}
              {submitLabel}
            </button>
            {canDeleteRating ? (
              <button
                type="button"
                disabled={isDeletingRating}
                className="inline-flex min-h-[44px] items-center justify-center rounded-full px-5 py-2 text-sm font-semibold text-accent hover:bg-primary-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={onDeleteRating}
              >
                {isDeletingRating ? "Deleting..." : "Delete rating"}
              </button>
            ) : null}
          </div>
        </div>
      </form>
    </section>
  );
}
