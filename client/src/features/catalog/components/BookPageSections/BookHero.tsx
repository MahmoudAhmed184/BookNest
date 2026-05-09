import type { ReactElement } from "react";

import { InlineSpinner, StarRating } from "../../../../components/ui";
import { getFallbackHueStyle, getInitials } from "../../../../utils/colorFromString";
import type { Book } from "../../types/book";
import { getAuthorNames } from "../../utils/bookFacets";
import { BookActions } from "./BookActions";
import { BookDescription } from "./BookDescription";
import { BookMetadata } from "./BookMetadata";
import { BookSummary } from "./BookSummary";

export interface BookHeroProps {
  book: Book;
  isDescriptionExpanded: boolean;
  coverFailed: boolean;
  isAddPending: boolean;
  isMarkReadPending: boolean;
  isSavingRating: boolean;
  canAddToList: boolean;
  canMarkAsRead: boolean;
  rating: number;
  listPopover?: ReactElement | null | undefined;
  onAddBook: () => void;
  onMarkAsRead: () => void;
  onRateBook: (rating: number) => void;
  onToggleDescription: () => void;
  onCoverError: () => void;
}

function normalizeRating(value?: number | string | null): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatCount(value: number | undefined, noun: string): string {
  const count = value ?? 0;
  const label = count === 1 ? noun : `${noun}s`;
  return `${new Intl.NumberFormat("en").format(count)} ${label}`;
}

export function BookHero({
  book,
  isDescriptionExpanded,
  coverFailed,
  isAddPending,
  isMarkReadPending,
  isSavingRating,
  canAddToList,
  canMarkAsRead,
  rating,
  listPopover,
  onAddBook,
  onMarkAsRead,
  onRateBook,
  onToggleDescription,
  onCoverError,
}: BookHeroProps): ReactElement {
  const authors = getAuthorNames(book);
  const description = book.description || "No description available yet.";
  const shouldCollapseDescription = description.length > 320;
  const cover = book.cover || book.cover_fallback_url;
  const canShowCover = Boolean(cover) && !coverFailed;
  const averageRating = normalizeRating(book.average_rating);

  return (
    <section
      className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden pb-6 pt-6 sm:pb-10 sm:pt-10"
      aria-labelledby="book-title"
    >
      {canShowCover ? (
        <img
          src={cover ?? undefined}
          alt=""
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-15 blur-3xl"
          aria-hidden="true"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-b from-primary-black/20 via-primary-black/75 to-primary-black" aria-hidden="true" />
      <div className="container relative grid gap-8 lg:grid-cols-[minmax(260px,360px)_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="mx-auto w-full max-w-[320px] lg:sticky lg:top-28 lg:mx-0 lg:max-w-none lg:self-start">
          <div className="overflow-hidden rounded-xl border border-[var(--surface-glass-border)] bg-secondary-black shadow-lg">
            {canShowCover ? (
              <img
                src={cover ?? undefined}
                alt={`Cover of ${book.title}`}
                className="aspect-[2/3] w-full object-cover"
                width="760"
                height="1140"
                loading="eager"
                decoding="async"
                onError={onCoverError}
              />
            ) : (
              <div
                className="fallback-gradient flex aspect-[2/3] w-full items-center justify-center px-8 text-center text-5xl font-bold text-primary-white"
                style={getFallbackHueStyle(book.title)}
              >
                <span aria-hidden="true">{getInitials(book.title)}</span>
                <span className="sr-only">Cover unavailable for {book.title}</span>
              </div>
            )}
          </div>
        </aside>
        <div className="min-w-0">
          <BookSummary book={book} authors={authors} />
          <div className="glass-card mt-6 p-4 sm:p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-display text-5xl font-black leading-none text-primary-white">
                    {averageRating.toFixed(1)}
                  </span>
                  <StarRating
                    value={averageRating}
                    size="lg"
                    label={`Average rating ${averageRating.toFixed(1)} out of 5`}
                  />
                </div>
                <p className="mt-2 text-sm text-primary-gray">
                  {formatCount(book.rating_count, "rating")} / {formatCount(book.review_count, "review")}
                </p>
              </div>
              <BookActions
                isAddPending={isAddPending}
                isMarkReadPending={isMarkReadPending}
                canAddToList={canAddToList}
                canMarkAsRead={canMarkAsRead}
                listPopover={listPopover}
                onAddBook={onAddBook}
                onMarkAsRead={onMarkAsRead}
              />
            </div>
            <div className="mt-5 border-t border-[var(--surface-glass-border)] pt-5">
              <div className="mb-2 flex items-center gap-3">
                <p className="text-sm font-semibold text-primary-white">Rate this book</p>
                {isSavingRating ? (
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-primary-gray" role="status">
                    <InlineSpinner className="h-3.5 w-3.5" />
                    Saving
                  </span>
                ) : null}
              </div>
              <StarRating
                value={rating}
                size="lg"
                readOnly={isSavingRating}
                onChange={isSavingRating ? undefined : onRateBook}
                label="Rate this book"
              />
            </div>
          </div>
          <div className="glass-card mt-6 p-5 sm:p-7">
            <BookDescription
              description={description}
              isExpanded={isDescriptionExpanded}
              shouldCollapse={shouldCollapseDescription}
              onToggle={onToggleDescription}
            />
            <div className="mt-8">
              <BookMetadata book={book} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
