import { useEffect, useId, useRef, useState, type ReactElement } from "react";

import { InlineSpinner } from "../../../../components/ui";
import { getFallbackHueStyle, getInitials } from "../../../../utils/colorFromString";
import type { BookReview } from "../../../catalog/types/book";

export interface DeleteReviewDialogProps {
  review: BookReview | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function ReviewDialogCover({ review }: { review: BookReview }): ReactElement {
  const [hasImageError, setHasImageError] = useState(false);
  const title = review.book_title || "Book";
  const canShowCover = Boolean(review.book_cover) && !hasImageError;

  return (
    <div
      className="h-28 w-20 shrink-0 overflow-hidden rounded-lg bg-primary-black shadow-xl"
      style={canShowCover ? undefined : getFallbackHueStyle(title)}
    >
      {canShowCover ? (
        <img
          src={review.book_cover ?? undefined}
          alt={`Cover of ${title}`}
          className="h-full w-full object-cover"
          onError={() => setHasImageError(true)}
        />
      ) : (
        <div className="fallback-gradient flex h-full w-full items-center justify-center px-2 text-center text-xl font-extrabold text-primary-white">
          <span aria-hidden="true">{getInitials(title)}</span>
          <span className="sr-only">Cover unavailable for {title}</span>
        </div>
      )}
    </div>
  );
}

export function DeleteReviewDialog({
  review,
  isDeleting,
  onCancel,
  onConfirm,
}: DeleteReviewDialogProps): ReactElement | null {
  const titleId = useId();
  const descriptionId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!review) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape" && !isDeleting) onCancel();
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [review, isDeleting, onCancel]);

  if (!review) return null;

  const bookTitle = review.book_title || "Untitled book";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-primary-black/75 px-4 py-8 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isDeleting) onCancel();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="glass-card w-full max-w-lg animate-fade-up overflow-hidden text-primary-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">Remove review</p>
            <h2 id={titleId} className="mt-1 text-xl font-bold sm:text-2xl">
              Delete this review?
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-2xl leading-none text-primary-gray hover:bg-primary-black hover:text-primary-white"
            aria-label="Close delete review popup"
            disabled={isDeleting}
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        <div className="flex flex-col gap-5 px-5 py-5 sm:flex-row sm:px-6">
          <ReviewDialogCover review={review} />
          <div className="min-w-0">
            <p id={descriptionId} className="text-sm leading-relaxed text-primary-gray">
              This removes your review from your profile and the book page. The book stays on your shelf.
            </p>
            <div className="mt-4 rounded-lg border border-white/10 bg-primary-black/35 p-4">
              <strong className="line-clamp-1 text-base text-primary-white" title={bookTitle}>
                {bookTitle}
              </strong>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-primary-gray">
                {review.review_text}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-white/10 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            className="btn inline-flex min-h-[44px] items-center justify-center border border-white/10 bg-secondary-black px-5 py-2 text-sm hover:bg-secondary-gray"
            disabled={isDeleting}
          >
            Keep review
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn inline-flex min-h-[44px] items-center justify-center gap-2 border border-[var(--color-error-border)] bg-[var(--color-error-surface)] px-5 py-2 text-sm hover:bg-red-900/45"
            disabled={isDeleting}
          >
            {isDeleting ? <InlineSpinner /> : null}
            Delete review
          </button>
        </div>
      </section>
    </div>
  );
}
