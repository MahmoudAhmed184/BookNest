import {
  useEffect,
  type ReactElement,
} from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import {
  BookCard,
  BookCardSkeleton,
  EmptyState,
  ErrorState,
  LoadMorePagination,
} from "../../../components/ui";
import { usePageSearchParam } from "../../../hooks/usePageSearchParam";
import {
  routeBuilders,
  routePaths,
  type GenreBooksRouteParams,
} from "../../../routes/paths";
import { useGenreBooks } from "../hooks/useGenreBooks";
import { getAuthorNames } from "../utils/bookFacets";

const skeletonKeys = ["genre-book-1", "genre-book-2", "genre-book-3", "genre-book-4"];

export default function GenreBooksPage(): ReactElement {
  const { id } = useParams<GenreBooksRouteParams>();
  const [searchParams] = useSearchParams();
  const { page, setPage } = usePageSearchParam();
  const genreName = searchParams.get("name") || `Genre ${id ?? ""}`;
  const {
    books,
    pagination,
    isLoading,
    isFetching,
    isError,
    isLoadingMore,
    refetch,
  } = useGenreBooks(id, page);

  useEffect(() => {
    if (
      pagination.totalPages === 0 ||
      page <= pagination.totalPages
    ) {
      return;
    }

    setPage(pagination.totalPages, { replace: true });
  }, [page, pagination.totalPages, setPage]);

  const loadMore = (): void => {
    setPage(page + 1);
  };

  return (
    <div className="flex flex-col gap-8 py-12 animate-fade-up">
      <header className="flex flex-col gap-3">
        <Link
          to={routePaths.genres}
          className="text-sm font-semibold text-accent transition hover:text-primary-white"
        >
          Back to genres
        </Link>
        <div className="flex flex-col gap-2">
          <h1 className="display-heading text-3xl sm:text-4xl">{genreName}</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-primary-gray">
            Browse books in this genre from the catalog.
          </p>
        </div>
      </header>

      <section className="flex flex-col gap-6" aria-label={`${genreName} books`}>
        {isLoading ? (
          <div className="catalog-grid" role="status" aria-live="polite">
            {skeletonKeys.map((key) => (
              <BookCardSkeleton key={key} />
            ))}
          </div>
        ) : null}

        {isError ? (
          <ErrorState
            title="Genre books could not be loaded"
            message="We could not load books for this genre right now."
            onRetry={refetch}
            isRetrying={isFetching}
          />
        ) : null}

        {!isLoading && !isError && books.length === 0 ? (
          <EmptyState
            title="No books found"
            description="This genre does not have catalog books yet."
            actionLabel="Browse genres"
            actionTo={routePaths.genres}
          />
        ) : null}

        {!isLoading && !isError && books.length > 0 ? (
          <div className="catalog-grid">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                to={routeBuilders.book(book.id)}
                title={book.title}
                author={getAuthorNames(book)}
                coverSrc={book.cover || book.cover_fallback_url}
              />
            ))}
          </div>
        ) : null}

        {!isLoading && !isError ? (
          <LoadMorePagination
            shownCount={books.length}
            totalCount={pagination.count}
            hasMore={pagination.hasNext}
            onLoadMore={loadMore}
            isLoading={isLoadingMore}
            itemLabel="books"
            ariaLabel={`More ${genreName} books`}
          />
        ) : null}
      </section>
    </div>
  );
}
