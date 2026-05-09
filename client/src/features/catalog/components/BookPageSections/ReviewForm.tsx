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
  const trimmedReview = reviewText.trim();
  const wordCount = trimmedReview ? trimmedReview.split(/\s+/).length : 0;
  const ratingLabel = rating ? `${rating} / 5` : "No rating";
  const hasReviewDraft = trimmedReview.length > 0;
  const draftStatusLabel = hasReviewDraft
    ? "Review draft"
    : rating
      ? "Rating only"
      : "No note yet";

  return (
    <section aria-labelledby="review-form-title">
      <form
        onSubmit={onSubmit}
        className="glass-card overflow-hidden p-0"
      >
        <div className="grid lg:grid-cols-[minmax(260px,360px)_minmax(0,1fr)]">
          <div className="border-b border-[var(--surface-glass-border)] p-5 sm:p-6 lg:border-b-0 lg:border-r">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Reader note
            </p>
            <h2
              id="review-form-title"
              className="mt-2 font-display text-3xl font-bold leading-tight text-primary-white"
            >
              Write a review
            </h2>
            <p className="mt-3 text-sm leading-6 text-primary-gray">
              A focused note for readers considering this book.
            </p>

            <fieldset className="mt-6 rounded-xl border border-[var(--surface-glass-border)] bg-primary-black/25 p-4">
              <legend className="sr-only">Your rating</legend>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-primary-white">
                  Your rating
                </span>
                <span className="rounded-full bg-primary-white/10 px-3 py-1 text-xs font-semibold text-primary-white">
                  {ratingLabel}
                </span>
              </div>
              <StarRating
                value={rating}
                size="lg"
                readOnly={false}
                onChange={onRatingChange}
                label="Choose a rating"
                className="-ml-2 mt-3"
              />
            </fieldset>

            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-primary-gray">
              <span className="rounded-full border border-[var(--surface-glass-border)] px-3 py-1">
                {wordCount} {wordCount === 1 ? "word" : "words"}
              </span>
              <span className="rounded-full border border-[var(--surface-glass-border)] px-3 py-1">
                {draftStatusLabel}
              </span>
            </div>
          </div>

          <div className="flex min-h-[320px] flex-col p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="reviewText" className="text-sm font-semibold text-primary-white">
                Review
              </label>
              <span className="text-xs font-semibold text-primary-gray" aria-live="polite">
                {reviewText.length.toLocaleString()} characters
              </span>
            </div>
            <textarea
              id="reviewText"
              value={reviewText}
              onChange={(event) => onReviewTextChange(event.target.value)}
              className="field mt-3 min-h-[190px] w-full flex-1 resize-y rounded-xl border border-[var(--surface-glass-border)] bg-primary-black/30 text-primary-white placeholder:text-primary-gray focus:border-accent focus:bg-primary-black/45"
              placeholder="What should other readers know?"
            />

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              {canDeleteRating ? (
                <button
                  type="button"
                  disabled={isDeletingRating}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-primary-gray hover:bg-primary-white/10 hover:text-primary-white disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={onDeleteRating}
                >
                  {isDeletingRating ? "Deleting..." : "Delete rating"}
                </button>
              ) : (
                <span aria-hidden="true" />
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-accent-v inline-flex min-h-[46px] items-center justify-center gap-2 px-6 py-2 text-sm text-primary-white shadow-md hover:-translate-y-0.5 hover:shadow-lg sm:min-w-40"
              >
                {isSubmitting ? <InlineSpinner /> : null}
                {submitLabel}
              </button>
            </div>
          </div>
        </div>
      </form>
    </section>
  );
}
