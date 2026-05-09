import {
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import {
  BookCard,
  BookCardSkeleton,
  EmptyState,
  ErrorState,
  LoadMorePagination,
} from "../../../components/ui";
import { usePageSearchParam } from "../../../hooks/usePageSearchParam";
import { routeBuilders, routePaths } from "../../../routes/paths";
import { catalogKeys } from "../hooks/catalog.keys";
import { useCatalogGenres } from "../hooks/useCatalogGenres";
import { getGenreBooks, getGenres } from "../services/bookService";
import type { Book, CatalogGenre } from "../types/book";
import { getAuthorNames } from "../utils/bookFacets";

const genreSkeletonKeys = [
  "genre-card-1",
  "genre-card-2",
  "genre-card-3",
  "genre-card-4",
  "genre-card-5",
  "genre-card-6",
  "genre-card-7",
  "genre-card-8",
  "genre-card-9",
  "genre-card-10",
  "genre-card-11",
  "genre-card-12",
];
const genreShelfBookLimit = 8;
const genreShelfGridClass = "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4";
const bookSkeletonKeys = Array.from(
  { length: genreShelfBookLimit },
  (_, index) => `genre-book-${index + 1}`
);

function genreBooksPath(genre: CatalogGenre): string {
  return `${routeBuilders.genreBooks(genre.id)}?name=${encodeURIComponent(
    genre.name
  )}&page=1`;
}

function formatBookCount(count?: number): string | null {
  if (count === undefined) return null;
  return `${count.toLocaleString()} ${count === 1 ? "book" : "books"}`;
}

interface GenreCardProps {
  genre: CatalogGenre;
}

function GenreCard({ genre }: GenreCardProps): ReactElement {
  const countLabel = formatBookCount(genre.books_count);

  return (
    <Link
      to={genreBooksPath(genre)}
      className="card-lift flex min-h-[84px] items-center justify-between gap-3 rounded-lg border border-secondary-gray/70 bg-secondary-black/80 px-4 py-3 text-primary-white hover:border-accent hover:bg-primary-black/70"
    >
      <span className="min-w-0 truncate text-base font-bold">{genre.name}</span>
      {countLabel ? (
        <span className="shrink-0 rounded-full bg-primary-black/60 px-3 py-1 text-xs font-semibold text-primary-gray">
          {countLabel}
        </span>
      ) : null}
    </Link>
  );
}

interface GenreGridProps {
  genres: CatalogGenre[];
}

function GenreGrid({ genres }: GenreGridProps): ReactElement {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {genres.map((genre) => (
        <GenreCard key={genre.id} genre={genre} />
      ))}
    </div>
  );
}

interface GenreShelfProps {
  genre: CatalogGenre;
  books: Book[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  onRetry: () => void;
}

function GenreShelf({
  genre,
  books,
  isLoading,
  isFetching,
  isError,
  onRetry,
}: GenreShelfProps): ReactElement {
  const titleId = `genre-shelf-${genre.id}`;

  return (
    <article className="flex flex-col gap-4" aria-labelledby={titleId}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id={titleId} className="text-xl font-bold text-primary-white">
          {genre.name}
        </h3>
        <Link
          to={genreBooksPath(genre)}
          className="inline-flex min-h-[40px] items-center rounded-full px-4 py-2 text-sm font-semibold text-primary-gray hover:bg-secondary-black hover:text-primary-white"
        >
          See more
        </Link>
      </div>

      {isLoading ? (
        <div className={genreShelfGridClass} role="status" aria-live="polite">
          {bookSkeletonKeys.map((key) => (
            <BookCardSkeleton key={key} />
          ))}
        </div>
      ) : null}

      {isError ? (
        <ErrorState
          title={`${genre.name} books could not be loaded`}
          message="We could not load books for this genre right now."
          onRetry={onRetry}
          isRetrying={isFetching}
        />
      ) : null}

      {!isLoading && !isError && books.length === 0 ? (
        <EmptyState
          title={`No ${genre.name} books yet`}
          description="This shelf will fill in as the catalog grows."
          actionLabel="Explore catalog"
          actionTo={routePaths.explore}
        />
      ) : null}

      {!isLoading && !isError && books.length > 0 ? (
        <div className={genreShelfGridClass}>
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              to={routeBuilders.book(book.id)}
              title={book.title}
              author={getAuthorNames(book)}
              coverSrc={book.cover || book.cover_fallback_url}
              rating={book.average_rating}
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}

function SearchIcon(): ReactElement {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

export default function Categories(): ReactElement {
  const searchId = useId();
  const { page, setPage } = usePageSearchParam();
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const activeSearchQuery = deferredSearchQuery.trim();
  const hasSearchQuery = activeSearchQuery.length > 0;
  const previousSearchQuery = useRef(activeSearchQuery);
  const {
    genres,
    pagination,
    isLoading,
    isFetching,
    isError,
    isLoadingMore,
    refetch,
  } = useCatalogGenres(page, activeSearchQuery);
  const popularGenresQuery = useQuery({
    queryKey: catalogKeys.genres(12),
    queryFn: () => getGenres(12),
    staleTime: 5 * 60_000,
  });
  const popularGenres = useMemo(
    () => popularGenresQuery.data ?? [],
    [popularGenresQuery.data]
  );
  const shelfGenres = useMemo(() => popularGenres.slice(0, 6), [popularGenres]);
  const genreBookQueries = useQueries({
    queries: shelfGenres.map((genre) => ({
      queryKey: catalogKeys.genreBooks(genre.id, 1, genreShelfBookLimit, {}),
      queryFn: () =>
        getGenreBooks(genre.id, { page: 1, pageSize: genreShelfBookLimit }),
      staleTime: 60_000,
    })),
  });
  const isSearchPending = searchQuery.trim() !== activeSearchQuery;

  useEffect(() => {
    if (previousSearchQuery.current === activeSearchQuery) return;

    previousSearchQuery.current = activeSearchQuery;
    setPage(1, { replace: true });
  }, [activeSearchQuery, setPage]);

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
    <div className="flex flex-col gap-10 py-10 animate-fade-up sm:py-12">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex max-w-3xl flex-col gap-3">
          <p className="text-xs font-bold uppercase text-accent">
            Genre discovery
          </p>
          <h1 className="display-heading">Browse Genres</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-primary-gray">
            Find focused shelves by genre, then jump into the full list when a
            shelf matches what you want to read next.
          </p>
        </div>

        <form
          className="w-full lg:max-w-md"
          role="search"
          onSubmit={(event) => event.preventDefault()}
        >
          <label htmlFor={searchId} className="sr-only">
            Search genres
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 text-primary-gray">
              <SearchIcon />
            </span>
            <input
              id={searchId}
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.currentTarget.value)}
              placeholder="Search genres"
              className="field min-h-[52px] w-full rounded-lg border-secondary-gray bg-primary-black/40 pl-12 pr-24 text-primary-white placeholder:text-primary-gray focus:border-accent focus:bg-primary-black"
            />
            {searchQuery.trim().length > 0 ? (
              <button
                type="button"
                className="absolute right-2 top-1/2 inline-flex min-h-[36px] -translate-y-1/2 items-center rounded-lg px-3 text-sm font-semibold text-primary-gray hover:bg-secondary-black hover:text-primary-white"
                onClick={() => setSearchQuery("")}
              >
                Clear
              </button>
            ) : null}
          </div>
          <p className="sr-only" aria-live="polite">
            {isSearchPending ? "Updating genre results" : "Genre results ready"}
          </p>
        </form>
      </header>

      {hasSearchQuery ? (
        <section
          className="flex flex-col gap-6"
          aria-labelledby="matching-genres"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h2 id="matching-genres" className="text-2xl font-bold text-primary-white">
                Matching Genres
              </h2>
              <p className="text-sm text-primary-gray" aria-live="polite">
                {pagination.count.toLocaleString()} result
                {pagination.count === 1 ? "" : "s"} for {activeSearchQuery}
              </p>
            </div>
            <button
              type="button"
              className="inline-flex min-h-[40px] items-center rounded-full px-4 py-2 text-sm font-semibold text-primary-gray hover:bg-secondary-black hover:text-primary-white"
              onClick={() => setSearchQuery("")}
            >
              Show popular
            </button>
          </div>

          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" role="status" aria-live="polite">
              {genreSkeletonKeys.map((key) => (
                <div key={key} className="h-[84px] rounded-lg animate-shimmer" />
              ))}
            </div>
          ) : null}

          {isError ? (
            <ErrorState
              title="Genres could not be loaded"
              message="We could not load matching genres right now."
              onRetry={refetch}
              isRetrying={isFetching}
            />
          ) : null}

          {!isLoading && !isError && genres.length === 0 ? (
            <EmptyState
              title="No matching genres"
              description="Try a different genre name."
              actionLabel="Show popular genres"
              onAction={() => setSearchQuery("")}
            />
          ) : null}

          {!isLoading && !isError && genres.length > 0 ? (
            <GenreGrid genres={genres} />
          ) : null}

          {!isLoading && !isError ? (
            <LoadMorePagination
              shownCount={genres.length}
              totalCount={pagination.count}
              hasMore={pagination.hasNext}
              onLoadMore={loadMore}
              isLoading={isLoadingMore}
              itemLabel="genres"
              ariaLabel="More matching genres"
            />
          ) : null}
        </section>
      ) : (
        <>
          <section className="flex flex-col gap-5" aria-labelledby="popular-genres">
            <div className="flex flex-col gap-2">
              <h2 id="popular-genres" className="text-2xl font-bold text-primary-white">
                Popular Genres
              </h2>
              <p className="max-w-2xl text-sm text-primary-gray">
                Start with the most active shelves in the catalog.
              </p>
            </div>

            {popularGenresQuery.isLoading ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" role="status" aria-live="polite">
                {genreSkeletonKeys.map((key) => (
                  <div key={key} className="h-[84px] rounded-lg animate-shimmer" />
                ))}
              </div>
            ) : null}

            {popularGenresQuery.isError ? (
              <ErrorState
                title="Popular genres could not be loaded"
                message="We could not load popular genres right now."
                onRetry={() => void popularGenresQuery.refetch()}
                isRetrying={popularGenresQuery.isFetching}
              />
            ) : null}

            {!popularGenresQuery.isLoading &&
            !popularGenresQuery.isError &&
            popularGenres.length === 0 ? (
              <EmptyState
                title="No popular genres yet"
                description="Genre shelves will appear here when the catalog is available."
                actionLabel="Explore catalog"
                actionTo={routePaths.explore}
              />
            ) : null}

            {!popularGenresQuery.isLoading &&
            !popularGenresQuery.isError &&
            popularGenres.length > 0 ? (
              <GenreGrid genres={popularGenres} />
            ) : null}
          </section>

          <section className="flex flex-col gap-6" aria-labelledby="genre-shelves">
            <div className="flex flex-col gap-2">
              <h2 id="genre-shelves" className="text-2xl font-bold text-primary-white">
                Popular Genre Shelves
              </h2>
              <p className="max-w-2xl text-sm text-primary-gray">
                Preview a few books from each shelf before opening the full
                genre.
              </p>
            </div>

            {popularGenresQuery.isLoading ? (
              <div className="flex flex-col gap-10" role="status" aria-live="polite">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} className="flex flex-col gap-4">
                    <div className="h-7 w-44 rounded-full animate-shimmer" />
                    <div className={genreShelfGridClass}>
                      {bookSkeletonKeys.map((key) => (
                        <BookCardSkeleton key={`${key}-${index}`} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {!popularGenresQuery.isLoading &&
            !popularGenresQuery.isError &&
            shelfGenres.length > 0 ? (
              <div className="flex flex-col gap-10">
                {shelfGenres.map((genre, index) => {
                  const genreBookQuery = genreBookQueries[index];
                  const books = genreBookQuery?.data?.results ?? [];

                  return (
                    <GenreShelf
                      key={genre.id}
                      genre={genre}
                      books={books}
                      isLoading={genreBookQuery?.isLoading ?? false}
                      isFetching={genreBookQuery?.isFetching ?? false}
                      isError={genreBookQuery?.isError ?? false}
                      onRetry={() => void genreBookQuery?.refetch()}
                    />
                  );
                })}
              </div>
            ) : null}
          </section>
        </>
      )}
    </div>
  );
}
