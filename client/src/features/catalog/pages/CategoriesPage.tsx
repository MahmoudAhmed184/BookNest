import {
  useCallback,
  useEffect,
  useRef,
  type ReactElement,
} from "react";
import { Link } from "react-router-dom";

import {
  BookCardSkeleton,
  EmptyState,
  ErrorState,
  Pagination,
} from "../../../components/ui";
import { usePageSearchParam } from "../../../hooks/usePageSearchParam";
import { routeBuilders, routePaths } from "../../../routes/paths";
import { useCatalogGenres } from "../hooks/useCatalogGenres";

const skeletonKeys = ["category-1", "category-2", "category-3", "category-4"];

export default function Categories(): ReactElement {
  const { page, setPage } = usePageSearchParam();
  const resultsRef = useRef<HTMLDivElement>(null);
  const hasScrolledAfterMount = useRef(false);
  const {
    genres,
    pagination,
    isLoading,
    isFetching,
    isError,
    isPlaceholderData,
    refetch,
  } = useCatalogGenres(page);

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
        <h1 className="display-heading">
          Browse Categories
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-primary-gray">
          Pick a genre to jump into a focused search shelf.
        </p>
      </header>

      <div ref={resultsRef} className="flex flex-col gap-6">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" role="status" aria-live="polite">
            {skeletonKeys.map((key) => (
              <BookCardSkeleton key={key} showAuthor={false} />
            ))}
          </div>
        ) : null}

        {isError ? (
          <ErrorState
            title="Categories could not be loaded"
            message="We could not load book categories right now."
            onRetry={refetch}
            isRetrying={isFetching}
          />
        ) : null}

        {!isLoading && !isError && genres.length === 0 ? (
          <EmptyState
            title="No categories yet"
            description="Discovery categories will appear here when they are available."
            actionLabel="Explore books"
            actionTo={routePaths.explore}
          />
        ) : null}

        {!isLoading && !isError && genres.length > 0 ? (
          <div className="flex flex-wrap gap-3" aria-label="Book categories">
            {genres.map((category) => (
              <Link
                key={category.id}
                to={`${routeBuilders.genreBooks(category.id)}?name=${encodeURIComponent(
                  category.name
                )}&page=1`}
                title={`Browse ${category.name} books`}
                className="card-lift inline-flex min-h-[44px] items-center justify-center rounded-full bg-secondary-black px-4 py-2 text-center text-sm font-medium text-primary-white shadow-md focus-visible:outline-accent"
              >
                {category.name}
              </Link>
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
            ariaLabel="Categories pagination"
          />
        ) : null}
      </div>
    </div>
  );
}
