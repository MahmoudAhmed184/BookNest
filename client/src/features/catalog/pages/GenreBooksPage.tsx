import {
  useCallback,
  useEffect,
  useRef,
  type ReactElement,
} from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import {
  BookCard,
  BookCardSkeleton,
  EmptyState,
  ErrorState,
  Pagination,
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
  const resultsRef = useRef<HTMLDivElement>(null);
  const hasScrolledAfterMount = useRef(false);
  const genreName = searchParams.get("name") || `Genre ${id ?? ""}`;
  const {
    books,
    pagination,
    isLoading,
    isFetching,
    isError,
    isPlaceholderData,
    refetch,
  } = useGenreBooks(id, page);

  const scrollToResults = useCallback((): void => {
    const node = resultsRef.current;
    if (!node || typeof node.scrollIntoView !== "function") return;

    node.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    if (!hasScrolledAfterMount.current) {
      hasScrolledAfterMount.current = true;
      return;
    }

    window.requestAnimationFrame(scrollToResults);
  }, [page, scrollToResults]);

  useEffect(() => {
    if (
      isPlaceholderData ||
      pagination.totalPages === 0 ||
      page <= pagination.totalPages
    ) {
      return;
    }

    setPage(pagination.totalPages, { replace: true });
  }, [isPlaceholderData, page, pagination.totalPages, setPage]);

  return (
    <div className="flex flex-col gap-8 py-12 animate-fade-up">
      <header className="flex flex-col gap-3">
        <Link
          to={routePaths.categories}
          className="text-sm font-semibold text-accent transition hover:text-primary-white"
        >
          Back to categories
        </Link>
        <div className="flex flex-col gap-2">
          <h1 className="display-heading text-3xl sm:text-4xl">{genreName}</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-primary-gray">
            Browse books in this genre from the catalog.
          </p>
        </div>
      </header>

      <section ref={resultsRef} className="flex flex-col gap-6" aria-label={`${genreName} books`}>
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
            actionLabel="Browse categories"
            actionTo={routePaths.categories}
          />
        ) : null}

        {!isLoading && !isError && books.length > 0 ? (
          <div className="catalog-grid">
            {books.map((book) => (
              <BookCard
                key={book.id}
                to={routeBuilders.book(book.id)}
                title={book.title}
                author={getAuthorNames(book)}
                coverSrc={book.cover || book.cover_fallback_url}
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
            onPageChange={setPage}
            isDisabled={isPlaceholderData}
            ariaLabel={`${genreName} books pagination`}
          />
        ) : null}
      </section>
    </div>
  );
}
