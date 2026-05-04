import type { ReactElement } from "react";

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
  canAddToList: boolean;
  canMarkAsRead: boolean;
  onAddBook: () => void;
  onMarkAsRead: () => void;
  onToggleDescription: () => void;
  onCoverError: () => void;
}

export function BookHero({
  book,
  isDescriptionExpanded,
  coverFailed,
  isAddPending,
  isMarkReadPending,
  canAddToList,
  canMarkAsRead,
  onAddBook,
  onMarkAsRead,
  onToggleDescription,
  onCoverError,
}: BookHeroProps): ReactElement {
  const authors = getAuthorNames(book);
  const description = book.description || "No description available yet.";
  const shouldCollapseDescription = description.length > 320;
  const canShowCover = Boolean(book.cover_img) && !coverFailed;

  return (
    <section
      className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden py-10"
      aria-labelledby="book-title"
    >
      {canShowCover ? (
        <img
          src={book.cover_img ?? undefined}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-15 blur-2xl"
          aria-hidden="true"
        />
      ) : null}
      <div className="container relative grid gap-8 lg:grid-cols-[320px_1fr]">
        <div className="mx-auto w-full max-w-[320px] lg:mx-0">
          <div className="overflow-hidden rounded-xl bg-secondary-black shadow-xl">
            {canShowCover ? (
              <img
                src={book.cover_img ?? undefined}
                alt={`Cover of ${book.title}`}
                className="aspect-[2/3] w-full object-cover"
                width="320"
                height="480"
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
        </div>
        <div className="glass-card flex flex-col gap-6 p-5 sm:p-7">
          <BookSummary book={book} authors={authors} />
          <BookActions
            isAddPending={isAddPending}
            isMarkReadPending={isMarkReadPending}
            canAddToList={canAddToList}
            canMarkAsRead={canMarkAsRead}
            onAddBook={onAddBook}
            onMarkAsRead={onMarkAsRead}
          />
          <BookMetadata book={book} />
          <BookDescription
            description={description}
            isExpanded={isDescriptionExpanded}
            shouldCollapse={shouldCollapseDescription}
            onToggle={onToggleDescription}
          />
        </div>
      </div>
    </section>
  );
}
