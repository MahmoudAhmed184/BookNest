import type { ReactElement } from "react";

import { StarRating } from "../../../../components/ui";
import type { Book } from "../../types/book";
import { getBookGenres } from "../../utils/bookFacets";

export interface BookSummaryProps {
  book: Book;
  authors?: string | undefined;
}

function normalizeRating(value?: number | string | null): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number.parseFloat(value) || 0;
  return 0;
}

export function BookSummary({ book, authors }: BookSummaryProps): ReactElement {
  const genres = getBookGenres(book);
  const averageRating = normalizeRating(book.average_rating);

  return (
    <div className="flex flex-col gap-3">
      <h1 id="book-title" className="display-heading text-4xl md:text-5xl" title={book.title}>
        {book.title}
      </h1>
      {authors ? (
        <p className="text-lg text-primary-gray">
          by <span className="text-primary-white">{authors}</span>
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <StarRating
          value={averageRating}
          label={`Rating: ${averageRating} out of 5 from ${book.rating_count || 0} ratings`}
        />
        <span className="text-sm text-primary-gray">
          {book.rating_count || 0} ratings
        </span>
      </div>
      {genres.length ? (
        <div className="flex flex-wrap gap-2" aria-label="Book genres">
          {genres.map((genre) => (
            <span key={genre} className="rounded-full bg-secondary-black px-4 py-2 text-xs font-medium text-primary-gray">
              {genre}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
