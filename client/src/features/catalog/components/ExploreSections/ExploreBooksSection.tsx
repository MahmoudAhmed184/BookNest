import type { ReactElement } from "react";

import {
  BookCard,
  BookCardSkeleton,
  EmptyState,
  ErrorState,
  Pagination,
} from "../../../../components/ui";
import { routeBuilders, routePaths } from "../../../../routes/paths";
import type { OffsetPaginatedResponse } from "../../../../types/api";
import { getAuthorNames } from "../../utils/bookFacets";
import type { Book } from "../../types/book";
import { SectionTitle } from "./SectionTitle";

const skeletonKeys = ["books-1", "books-2", "books-3", "books-4", "books-5"];

export interface ExploreBooksSectionProps {
  books: Book[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isPaginationDisabled: boolean;
  hasActiveRefinement: boolean;
  pagination: OffsetPaginatedResponse<Book>;
  onRetry: () => void;
  onClearRefinements: () => void;
  onPageChange: (page: number) => void;
}

export function ExploreBooksSection({
  books,
  isLoading,
  isFetching,
  isError,
  isPaginationDisabled,
  hasActiveRefinement,
  pagination,
  onRetry,
  onClearRefinements,
  onPageChange,
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
        <div className="catalog-grid">
          {skeletonKeys.map((key) => <BookCardSkeleton key={key} />)}
        </div>
      ) : null}
      {isError ? (
        <ErrorState title="Books could not be loaded" message="We could not load this book shelf. Please try again." onRetry={onRetry} isRetrying={isFetching} />
      ) : null}
      {!isLoading && !isError && books.length === 0 && hasActiveRefinement ? (
        <EmptyState
          title="No books match these refinements"
          description="Remove a search term or genre filter to broaden the shelf."
          actionLabel="Clear refinements"
          onAction={onClearRefinements}
        />
      ) : null}
      {!isLoading && !isError && books.length === 0 && !hasActiveRefinement ? (
        <EmptyState
          title="No books found yet"
          description="Try searching for a genre, title, or author to keep exploring."
          actionLabel="Search books"
          actionTo={routePaths.search}
        />
      ) : null}
      {!isLoading && !isError && books.length > 0 ? (
        <div className="catalog-grid">
          {books.map((book) => (
            <BookCard
              key={book.isbn13}
              to={routeBuilders.book(book.isbn13)}
              title={book.title}
              author={getAuthorNames(book)}
              coverSrc={book.cover_img}
            />
          ))}
        </div>
      ) : null}
      {!isLoading && !isError ? (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          hasPreviousPage={pagination.hasPrevious}
          hasNextPage={pagination.hasNext}
          onPageChange={onPageChange}
          isDisabled={isPaginationDisabled}
          ariaLabel="Explore books pagination"
        />
      ) : null}
    </section>
  );
}
