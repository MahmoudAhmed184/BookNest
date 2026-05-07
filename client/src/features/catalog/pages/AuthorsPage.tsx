import {
  useCallback,
  useEffect,
  useRef,
  type ReactElement,
} from "react";
import { Link, useSearchParams } from "react-router-dom";

import {
  EmptyState,
  ErrorState,
  InlineSpinner,
  Pagination,
} from "../../../components/ui";
import { usePageSearchParam } from "../../../hooks/usePageSearchParam";
import { routeBuilders } from "../../../routes/paths";
import { getFallbackHueStyle, getInitials } from "../../../utils/colorFromString";
import { useAuthors } from "../hooks/useAuthors";
import type { Author } from "../types/book";

const skeletonKeys = ["author-1", "author-2", "author-3", "author-4"];

function AuthorCard({ author }: { author: Author }): ReactElement {
  const authorId = author.author_id ?? author.name;

  return (
    <Link
      to={routeBuilders.author(authorId)}
      className="glass-card card-lift flex items-center gap-4 p-4"
    >
      <div
        className="fallback-gradient flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-primary-white"
        style={getFallbackHueStyle(author.name)}
      >
        {getInitials(author.name)}
      </div>
      <div className="min-w-0">
        <h2 className="truncate text-base font-semibold text-primary-white">
          {author.name}
        </h2>
        <p className="text-sm text-primary-gray">
          {author.number_of_books ?? 0} books
        </p>
        {author.description ? (
          <p className="mt-1 line-clamp-2 text-sm text-primary-gray">
            {author.description}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

export default function AuthorsPage(): ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const { page, setPage } = usePageSearchParam();
  const resultsRef = useRef<HTMLDivElement>(null);
  const hasScrolledAfterMount = useRef(false);
  const query = searchParams.get("q") ?? "";
  const {
    authors,
    pagination,
    isLoading,
    isFetching,
    isError,
    isPlaceholderData,
    refetch,
  } = useAuthors(query, page);

  const scrollToResults = useCallback((): void => {
    const node = resultsRef.current;
    if (!node || typeof node.scrollIntoView !== "function") return;

    node.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const setQuery = (value: string): void => {
    const nextSearchParams = new URLSearchParams(searchParams);
    const trimmedValue = value.trim();
    if (trimmedValue) {
      nextSearchParams.set("q", trimmedValue);
    } else {
      nextSearchParams.delete("q");
    }
    nextSearchParams.set("page", "1");
    setSearchParams(nextSearchParams, { replace: true });
  };

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
        <h1 className="display-heading text-3xl sm:text-4xl">Authors</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-primary-gray">
          Search and browse catalog authors.
        </p>
      </header>

      <label className="flex max-w-xl flex-col gap-2 text-sm font-medium text-primary-white">
        Search authors
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="field w-full text-primary-white placeholder-primary-gray"
          placeholder="Author name"
          type="search"
          autoComplete="off"
        />
      </label>

      <section ref={resultsRef} className="flex flex-col gap-6" aria-label="Authors">
        {isLoading ? (
          <div
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
            role="status"
            aria-live="polite"
          >
            {skeletonKeys.map((key) => (
              <div key={key} className="glass-card flex items-center gap-4 p-4">
                <div className="h-14 w-14 rounded-xl animate-shimmer" />
                <div className="flex flex-1 flex-col gap-2">
                  <div className="h-4 w-32 rounded-full animate-shimmer" />
                  <div className="h-3 w-20 rounded-full animate-shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {isError ? (
          <ErrorState
            title="Authors could not be loaded"
            message="We could not load authors right now."
            onRetry={refetch}
            isRetrying={isFetching}
          />
        ) : null}

        {!isLoading && !isError && authors.length === 0 ? (
          <EmptyState
            title="No authors found"
            description="Adjust the search to find another author."
          />
        ) : null}

        {!isLoading && !isError && authors.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {authors.map((author) => (
              <AuthorCard key={author.author_id ?? author.name} author={author} />
            ))}
          </div>
        ) : null}

        {isFetching && !isLoading ? (
          <p className="flex items-center gap-2 text-sm text-primary-gray" role="status">
            <InlineSpinner />
            Updating authors
          </p>
        ) : null}

        {!isLoading && !isError ? (
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            hasPreviousPage={pagination.hasPrevious}
            hasNextPage={pagination.hasNext}
            onPageChange={setPage}
            isDisabled={isPlaceholderData}
            ariaLabel="Authors pagination"
          />
        ) : null}
      </section>
    </div>
  );
}
