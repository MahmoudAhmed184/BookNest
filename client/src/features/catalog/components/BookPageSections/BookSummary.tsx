import type { ReactElement } from "react";
import { Link } from "react-router-dom";

import { routeBuilders } from "../../../../routes/paths";
import type { Book } from "../../types/book";
import { getBookGenres } from "../../utils/bookFacets";

export interface BookSummaryProps {
  book: Book;
  authors?: string | undefined;
}

function genreKey(genre: string): string {
  return genre.trim().toLowerCase().replace(/\s+/g, "-");
}

export function BookSummary({ book, authors }: BookSummaryProps): ReactElement {
  const genres = getBookGenres(book);

  return (
    <div className="flex flex-col gap-4">
      {genres.length ? (
        <div className="flex flex-wrap gap-2" aria-label="Book genres">
          {genres.slice(0, 4).map((genre) => (
            <span
              key={genreKey(genre)}
              className="rounded-full border border-[var(--surface-glass-border)] bg-primary-white/5 px-4 py-2 text-xs font-semibold text-primary-gray"
            >
              {genre}
            </span>
          ))}
        </div>
      ) : null}
      <h1
        id="book-title"
        className="font-display text-5xl font-black leading-none text-primary-white sm:text-6xl xl:text-7xl"
        title={book.title}
      >
        {book.title}
      </h1>
      {book.subtitle ? (
        <p className="max-w-3xl text-lg leading-8 text-primary-gray sm:text-xl">
          {book.subtitle}
        </p>
      ) : null}
      {authors ? (
        <p className="text-lg text-primary-gray">
          by{" "}
          {book.authors?.length ? (
            book.authors.map((author, index) => (
              <span key={author.id}>
                <Link
                  to={routeBuilders.author(author.id)}
                  className="font-semibold text-primary-white underline-offset-4 hover:text-accent hover:underline"
                >
                  {author.name}
                </Link>
                {index < (book.authors?.length ?? 0) - 1 ? ", " : null}
              </span>
            ))
          ) : (
            <span className="font-semibold text-primary-white">{authors}</span>
          )}
        </p>
      ) : null}
    </div>
  );
}
