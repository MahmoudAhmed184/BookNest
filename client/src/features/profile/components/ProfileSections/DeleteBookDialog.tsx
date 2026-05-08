import { useEffect, useId, useRef, useState, type ReactElement } from "react";

import { InlineSpinner } from "../../../../components/ui";
import { getFallbackHueStyle, getInitials } from "../../../../utils/colorFromString";
import type { Book } from "../../../catalog/types/book";
import { getAuthorNames } from "../../../catalog/utils/bookFacets";

export interface DeleteBookDialogProps {
  book: Book | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function DialogCover({ book }: { book: Book }): ReactElement {
  const [hasImageError, setHasImageError] = useState(false);
  const cover = book.cover || book.cover_fallback_url;
  const canShowCover = Boolean(cover) && !hasImageError;

  return (
    <div
      className="h-28 w-20 shrink-0 overflow-hidden rounded-lg bg-primary-black shadow-xl"
      style={canShowCover ? undefined : getFallbackHueStyle(book.title)}
    >
      {canShowCover ? (
        <img
          src={cover ?? undefined}
          alt={`Cover of ${book.title}`}
          className="h-full w-full object-cover"
          onError={() => setHasImageError(true)}
        />
      ) : (
        <div className="fallback-gradient flex h-full w-full items-center justify-center px-2 text-center text-xl font-extrabold text-primary-white">
          <span aria-hidden="true">{getInitials(book.title)}</span>
          <span className="sr-only">Cover unavailable for {book.title}</span>
        </div>
      )}
    </div>
  );
}

export function DeleteBookDialog({
  book,
  isDeleting,
  onCancel,
  onConfirm,
}: DeleteBookDialogProps): ReactElement | null {
  const titleId = useId();
  const descriptionId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!book) return undefined;

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
  }, [book, isDeleting, onCancel]);

  if (!book) return null;

  const author = getAuthorNames(book);

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
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">Remove from shelf</p>
            <h2 id={titleId} className="mt-1 text-xl font-bold sm:text-2xl">
              Delete this book?
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-2xl leading-none text-primary-gray hover:bg-primary-black hover:text-primary-white"
            aria-label="Close delete book popup"
            disabled={isDeleting}
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        <div className="flex flex-col gap-5 px-5 py-5 sm:flex-row sm:px-6">
          <DialogCover book={book} />
          <div className="min-w-0">
            <p id={descriptionId} className="text-sm leading-relaxed text-primary-gray">
              This will remove the book from your profile shelf. Your reviews and ratings stay untouched.
            </p>
            <div className="mt-4 rounded-lg border border-white/10 bg-primary-black/35 p-4">
              <strong className="line-clamp-2 text-base text-primary-white" title={book.title}>
                {book.title}
              </strong>
              {author ? (
                <p className="mt-1 line-clamp-1 text-sm text-primary-gray" title={author}>
                  {author}
                </p>
              ) : null}
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
            Keep book
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn inline-flex min-h-[44px] items-center justify-center gap-2 border border-[var(--color-error-border)] bg-[var(--color-error-surface)] px-5 py-2 text-sm hover:bg-red-900/45"
            disabled={isDeleting}
          >
            {isDeleting ? <InlineSpinner /> : null}
            Remove book
          </button>
        </div>
      </section>
    </div>
  );
}
