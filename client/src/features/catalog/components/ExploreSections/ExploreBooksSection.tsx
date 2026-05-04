import type { ReactElement } from "react";

import { BookCard, BookCardSkeleton, EmptyState, ErrorState } from "../../../../components/ui";
import { routeBuilders, routePaths } from "../../../../routes/paths";
import { getAuthorNames } from "../../utils/bookFacets";
import type { Book } from "../../types/book";
import { SectionTitle } from "./SectionTitle";

const skeletonKeys = ["books-1", "books-2", "books-3", "books-4", "books-5"];

export interface ExploreBooksSectionProps {
  books: Book[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function ExploreBooksSection({
  books,
  isLoading,
  isFetching,
  isError,
  onRetry,
}: ExploreBooksSectionProps): ReactElement {
  return (
    <section className="flex flex-col gap-5" aria-labelledby="explore-books">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionTitle id="explore-books">Explore Books</SectionTitle>
        {isFetching && books.length > 0 ? (
          <p className="text-xs text-primary-gray" role="status">Updating books...</p>
        ) : null}
      </div>
      {isLoading ? (
        <div className="bento-grid">
          {skeletonKeys.map((key) => <BookCardSkeleton key={key} />)}
        </div>
      ) : null}
      {isError ? (
        <ErrorState title="Books could not be loaded" message="We could not load this book shelf. Please try again." onRetry={onRetry} isRetrying={isFetching} />
      ) : null}
      {!isLoading && !isError && books.length === 0 ? (
        <EmptyState
          title="No books found yet"
          description="Try searching for a genre, author, or mood to keep exploring."
          actionLabel="Search books"
          actionTo={routePaths.search}
        />
      ) : null}
      {!isLoading && !isError && books.length > 0 ? (
        <div className="bento-grid">
          {books.map((book, position) => (
            <BookCard
              key={book.isbn13}
              to={routeBuilders.book(book.isbn13)}
              title={book.title}
              author={getAuthorNames(book)}
              coverSrc={book.cover_img}
              variant={position === 0 ? "featured" : undefined}
              className={position === 0 ? "md:col-span-2 md:row-span-2" : ""}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
