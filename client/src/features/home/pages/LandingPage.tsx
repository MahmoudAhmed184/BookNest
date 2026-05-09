import { useMemo, type ReactElement } from "react";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { A11y, Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { BookCard, BookCardSkeleton, EmptyState, ErrorState } from "../../../components/ui";
import { routeBuilders, routePaths } from "../../../routes/paths";
import { useOptionalAuth } from "../../auth/hooks/useOptionalAuth";
import { BookCarousel, RecommendationsSection, SkeletonRow } from "../../catalog/components/ExploreSections";
import { catalogKeys } from "../../catalog/hooks/catalog.keys";
import { useLandingCatalog } from "../../catalog/hooks/useLandingCatalog";
import {
  clickRecommendation,
  createRecommendationFeedback,
  dismissRecommendation,
  getGenreBooks,
  getGenres,
  getNewReleaseBooks,
  getPopularBooks,
  getRecommendedBooks,
} from "../../catalog/services/bookService";
import type {
  Book,
  CatalogGenre,
  RecommendationFeedbackType,
  UserRecommendation,
} from "../../catalog/types/book";
import { getAuthorNames } from "../../catalog/utils/bookFacets";

const valueCards = [
  { id: "genres", title: "Guided discovery", copy: "Browse by genre, author, and community signals without losing the full catalog context." },
  { id: "shelf", title: "Living collections", copy: "Shape reading collections that feel like shelves, projects, and recommendations in one place." },
  { id: "social", title: "Reader signals", copy: "Use ratings and thoughtful reviews to find books with real community texture." },
] as const;

const landingBookSkeletonKeys = [
  "landing-book-1",
  "landing-book-2",
  "landing-book-3",
  "landing-book-4",
  "landing-book-5",
  "landing-book-6",
  "landing-book-7",
  "landing-book-8",
] as const;

const landingPreviewBookLimit = 8;
const landingRecommendationLimit = 12;
const landingGenrePreviewLimit = 8;
const landingGenreShelfLimit = 4;
const landingGenreShelfBookLimit = 4;

interface BookGridSectionProps {
  id: string;
  title: string;
  books: Book[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  emptyTitle: string;
  emptyDescription: string;
  onRetry: () => void;
  actionTo: string;
}

function BookGridSection({
  id,
  title,
  books,
  isLoading,
  isFetching,
  isError,
  emptyTitle,
  emptyDescription,
  onRetry,
  actionTo,
}: BookGridSectionProps): ReactElement {
  return (
    <section className="flex flex-col gap-5" aria-labelledby={id}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id={id} className="text-2xl font-bold text-primary-white">
          {title}
        </h2>
        <Link
          to={actionTo}
          className="inline-flex min-h-[40px] items-center rounded-full px-4 py-2 text-sm font-semibold text-primary-gray hover:bg-secondary-black hover:text-primary-white"
        >
          See more
        </Link>
      </div>
      {isLoading ? (
        <div className="landing-book-grid">
          {landingBookSkeletonKeys.map((key) => (
            <BookCardSkeleton key={key} />
          ))}
        </div>
      ) : null}
      {isError ? (
        <ErrorState
          title={`${title} could not be loaded`}
          message="We could not load this shelf right now."
          onRetry={onRetry}
          isRetrying={isFetching}
        />
      ) : null}
      {!isLoading && !isError && books.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          actionLabel="Explore catalog"
          actionTo={routePaths.explore}
        />
      ) : null}
      {!isLoading && !isError && books.length > 0 ? (
        <div className="landing-book-grid">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              to={routeBuilders.book(book.id)}
              title={book.title}
              author={getAuthorNames(book)}
              coverSrc={book.cover || book.cover_fallback_url}
              rating={book.average_rating}
              size="small"
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

interface MovingBookSectionProps {
  id: string;
  title: string;
  books: Book[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  emptyTitle: string;
  emptyDescription: string;
  onRetry: () => void;
}

function MovingBookSection({
  id,
  title,
  books,
  isLoading,
  isFetching,
  isError,
  emptyTitle,
  emptyDescription,
  onRetry,
}: MovingBookSectionProps): ReactElement {
  return (
    <section className="flex flex-col gap-5" aria-labelledby={id}>
      <h2 id={id} className="text-2xl font-bold text-primary-white">
        {title}
      </h2>
      {isLoading ? <SkeletonRow /> : null}
      {isError ? (
        <ErrorState
          title={`${title} could not be loaded`}
          message="We could not load this shelf right now."
          onRetry={onRetry}
          isRetrying={isFetching}
        />
      ) : null}
      {!isLoading && !isError && books.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          actionLabel="Explore catalog"
          actionTo={routePaths.explore}
        />
      ) : null}
      {!isLoading && !isError && books.length > 0 ? (
        <BookCarousel
          items={books}
          keyExtractor={(book) => String(book.id)}
          renderBook={(book) => (
            <BookCard
              book={book}
              to={routeBuilders.book(book.id)}
              title={book.title}
              author={getAuthorNames(book)}
              coverSrc={book.cover || book.cover_fallback_url}
              rating={book.average_rating}
              size="small"
            />
          )}
        />
      ) : null}
    </section>
  );
}

function genreBooksPath(genre: CatalogGenre): string {
  return `${routeBuilders.genreBooks(genre.id)}?name=${encodeURIComponent(
    genre.name
  )}&page=1`;
}

function formatBookCount(count?: number): string | null {
  if (count === undefined) return null;
  return `${count.toLocaleString()} ${count === 1 ? "book" : "books"}`;
}

interface GenrePreviewGridProps {
  genres: CatalogGenre[];
}

function GenrePreviewGrid({ genres }: GenrePreviewGridProps): ReactElement {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {genres.map((genre) => {
        const countLabel = formatBookCount(genre.books_count);

        return (
          <Link
            key={genre.id}
            to={genreBooksPath(genre)}
            className="card-lift flex min-h-[72px] items-center justify-between gap-3 rounded-lg border border-secondary-gray/70 bg-secondary-black/80 px-4 py-3 text-primary-white hover:border-accent hover:bg-primary-black/70"
          >
            <span className="min-w-0 truncate text-base font-bold">
              {genre.name}
            </span>
            {countLabel ? (
              <span className="shrink-0 rounded-full bg-primary-black/60 px-3 py-1 text-xs font-semibold text-primary-gray">
                {countLabel}
              </span>
            ) : null}
          </Link>
        );
      })}
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
  const titleId = `landing-genre-shelf-${genre.id}`;

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
        <div className="landing-book-grid" role="status" aria-live="polite">
          {landingBookSkeletonKeys.map((key) => (
            <BookCardSkeleton key={`${genre.id}-${key}`} />
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

      {!isLoading && !isError && books.length > 0 ? (
        <div className="landing-book-grid">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              to={routeBuilders.book(book.id)}
              title={book.title}
              author={getAuthorNames(book)}
              coverSrc={book.cover || book.cover_fallback_url}
              rating={book.average_rating}
              size="small"
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}

interface SignedInLandingProps {
  token?: string | null;
}

function SignedInLanding({ token }: SignedInLandingProps): ReactElement {
  const queryClient = useQueryClient();
  const recommendationsQuery = useQuery({
    queryKey: catalogKeys.recommendations(),
    queryFn: () => getRecommendedBooks(token),
    enabled: Boolean(token),
    staleTime: 60_000,
  });
  const popularBooksQuery = useQuery({
    queryKey: catalogKeys.popularBooks(landingPreviewBookLimit),
    queryFn: () => getPopularBooks(landingPreviewBookLimit),
    staleTime: 60_000,
  });
  const newReleaseBooksQuery = useQuery({
    queryKey: catalogKeys.newReleaseBooks(landingPreviewBookLimit),
    queryFn: () => getNewReleaseBooks(landingPreviewBookLimit),
    staleTime: 60_000,
  });
  const genresQuery = useQuery({
    queryKey: catalogKeys.genres(landingGenrePreviewLimit),
    queryFn: () => getGenres(landingGenrePreviewLimit),
    staleTime: 5 * 60_000,
  });
  const popularGenres = useMemo(
    () => (genresQuery.data ?? []).slice(0, landingGenrePreviewLimit),
    [genresQuery.data]
  );
  const landingShelfGenres = useMemo(
    () => popularGenres.slice(0, landingGenreShelfLimit),
    [popularGenres]
  );
  const genreBookQueries = useQueries({
    queries: landingShelfGenres.map((genre) => ({
      queryKey: catalogKeys.genreBooks(
        genre.id,
        1,
        landingGenreShelfBookLimit,
        {}
      ),
      queryFn: () =>
        getGenreBooks(genre.id, {
          page: 1,
          pageSize: landingGenreShelfBookLimit,
        }),
      staleTime: 60_000,
    })),
  });

  const invalidateRecommendations = (): void => {
    queryClient.invalidateQueries({ queryKey: catalogKeys.recommendations() });
  };
  const dismissMutation = useMutation({
    mutationFn: (id: number) => dismissRecommendation(id, token),
    onSuccess: () => {
      toast.success("Recommendation dismissed.");
      invalidateRecommendations();
    },
    onError: () => {
      toast.error("Couldn't dismiss that recommendation.");
    },
  });
  const clickMutation = useMutation({
    mutationFn: (id: number) => clickRecommendation(id, token),
    onSuccess: invalidateRecommendations,
  });
  const feedbackMutation = useMutation({
    mutationFn: ({
      recommendation,
      feedbackType,
    }: {
      recommendation: UserRecommendation;
      feedbackType: RecommendationFeedbackType;
    }) =>
      createRecommendationFeedback(
        {
          book: recommendation.book,
          recommendation: recommendation.id,
          feedback_type: feedbackType,
        },
        token
      ),
    onSuccess: () => {
      toast.success("Recommendation feedback saved.");
      invalidateRecommendations();
    },
    onError: () => {
      toast.error("Couldn't save that feedback.");
    },
  });

  const isRefreshingRecommendations =
    recommendationsQuery.isFetching ||
    dismissMutation.isPending ||
    clickMutation.isPending ||
    feedbackMutation.isPending;

  return (
    <div className="flex flex-col gap-12 py-10 animate-fade-up sm:py-12">
      <header className="flex flex-col gap-5">
        <div className="flex max-w-3xl flex-col gap-3">
          <p className="text-xs font-bold uppercase text-accent">
            Your BookNest
          </p>
          <h1 className="display-heading">Welcome back</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-primary-gray">
            Pick up from personalized recommendations, check what is popular
            this week, and jump into active genre shelves.
          </p>
        </div>
      </header>

      <RecommendationsSection
        recommendations={(recommendationsQuery.data ?? []).slice(0, landingRecommendationLimit)}
        isLoading={recommendationsQuery.isLoading}
        isFetching={recommendationsQuery.isFetching}
        isError={recommendationsQuery.isError}
        isRefreshing={isRefreshingRecommendations}
        canRefresh={Boolean(token)}
        onRetry={() => void recommendationsQuery.refetch()}
        onRefresh={() => void recommendationsQuery.refetch()}
        onRecommendationClick={(id) => clickMutation.mutate(id)}
        onDismiss={(id) => dismissMutation.mutate(id)}
        onFeedback={(recommendation, feedbackType) =>
          feedbackMutation.mutate({ recommendation, feedbackType })
        }
      />

      <MovingBookSection
        id="new-releases"
        title="New Releases"
        books={(newReleaseBooksQuery.data ?? []).slice(0, landingPreviewBookLimit)}
        isLoading={newReleaseBooksQuery.isLoading}
        isFetching={newReleaseBooksQuery.isFetching}
        isError={newReleaseBooksQuery.isError}
        emptyTitle="No new releases yet"
        emptyDescription="Recently published books will appear here when they are available."
        onRetry={() => void newReleaseBooksQuery.refetch()}
      />

      <BookGridSection
        id="popular-this-week"
        title="Popular This Week"
        books={(popularBooksQuery.data ?? []).slice(0, landingPreviewBookLimit)}
        isLoading={popularBooksQuery.isLoading}
        isFetching={popularBooksQuery.isFetching}
        isError={popularBooksQuery.isError}
        emptyTitle="No popular books yet"
        emptyDescription="Popular books will appear here when catalog signals are available."
        onRetry={() => void popularBooksQuery.refetch()}
        actionTo={routePaths.explore}
      />

      <section className="flex flex-col gap-6" aria-labelledby="signed-in-genres">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="signed-in-genres" className="text-2xl font-bold text-primary-white">
            Popular Genres
          </h2>
          <Link
            to={routePaths.genres}
            className="inline-flex min-h-[40px] items-center rounded-full px-4 py-2 text-sm font-semibold text-primary-gray hover:bg-secondary-black hover:text-primary-white"
          >
            See more
          </Link>
        </div>
        {genresQuery.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="settings-panel h-20 animate-pulse" />
            ))}
          </div>
        ) : null}
        {genresQuery.isError ? (
          <ErrorState
            title="Genres could not be loaded"
            message="We could not load popular genres right now."
            onRetry={() => void genresQuery.refetch()}
            isRetrying={genresQuery.isFetching}
          />
        ) : null}
        {!genresQuery.isLoading && !genresQuery.isError && popularGenres.length === 0 ? (
          <EmptyState
            title="No popular genres yet"
            description="Genre shelves will appear here when the catalog is available."
            actionLabel="Browse genres"
            actionTo={routePaths.genres}
          />
        ) : null}
        {!genresQuery.isLoading && !genresQuery.isError && popularGenres.length > 0 ? (
          <GenrePreviewGrid genres={popularGenres} />
        ) : null}
      </section>

      {!genresQuery.isLoading && !genresQuery.isError && landingShelfGenres.length > 0 ? (
        <section className="flex flex-col gap-6" aria-labelledby="landing-genre-shelves">
          <div className="flex flex-col gap-2">
            <h2
              id="landing-genre-shelves"
              className="text-2xl font-bold text-primary-white"
            >
              Popular Genre Shelves
            </h2>
            <p className="max-w-2xl text-sm text-primary-gray">
              A few books from the busiest genre shelves.
            </p>
          </div>

          <div className="flex flex-col gap-10">
            {landingShelfGenres.map((genre, index) => {
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
        </section>
      ) : null}
    </div>
  );
}

function GuestLanding(): ReactElement | null {
  const { books, featuredBook, isLoading, isFetching, isError, refetch } = useLandingCatalog();
  const heroBooks = books.slice(1, 4);
  const carouselBooks = books.slice(4, 10);

  return (
    <div className="flex flex-col gap-16 py-10">
      <section
        className="relative min-h-[calc(100vh-8rem)] overflow-hidden rounded-xl px-5 py-8 sm:px-6 lg:px-8 xl:px-10"
        aria-labelledby="landing-title"
      >
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,color-mix(in_srgb,var(--color-accent)_20%,transparent),transparent_28%),radial-gradient(circle_at_80%_70%,color-mix(in_srgb,var(--color-primary-gray)_14%,transparent),transparent_32%)]"
          aria-hidden="true"
        />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_1.15fr] lg:items-center">
          <div className="flex flex-col gap-6">
            <div className="animate-fade-up flex flex-col gap-4">
              <h1 id="landing-title" className="display-heading">
                Discover Your Next Favorite Book
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-primary-gray md:text-lg">
                Track what you read, explore the catalog by genre, and uncover
                shelves that match your taste.
              </p>
            </div>
            <div className="animate-fade-up flex flex-wrap gap-3" style={{ animationDelay: "100ms" }}>
              <Link
                to={routePaths.login}
                className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center px-5 py-2 text-sm font-medium text-primary-white shadow-md hover:-translate-y-0.5 hover:shadow-lg sm:px-6 sm:py-3 sm:text-base"
              >
                Get Started
              </Link>
              <Link
                to={routePaths.explore}
                className="btn btn-primary-v inline-flex min-h-[44px] items-center justify-center px-5 py-2 text-sm font-medium text-primary-white shadow-md hover:-translate-y-0.5 hover:shadow-lg sm:px-6 sm:py-3 sm:text-base"
              >
                Explore Now
              </Link>
            </div>
          </div>
          <div className="guest-hero-books-grid animate-fade-up" style={{ animationDelay: "200ms" }}>
            {isLoading ? (
              <>
                <BookCardSkeleton />
                <BookCardSkeleton />
                <BookCardSkeleton />
                <BookCardSkeleton />
              </>
            ) : null}
            {isError ? (
              <div className="sm:col-span-2">
                <ErrorState
                  title="Featured books could not be loaded"
                  message="We could not load the discovery shelf right now."
                  onRetry={refetch}
                  isRetrying={isFetching}
                />
              </div>
            ) : null}
            {!isLoading && !isError && !featuredBook ? (
              <div className="sm:col-span-2">
                <EmptyState
                  title="No featured books yet"
                  description="Books will appear here when the catalog is available."
                  actionLabel="Search books"
                  actionTo={routePaths.search}
                />
              </div>
            ) : null}
            {!isLoading && !isError && featuredBook ? (
              <>
                <BookCard
                  book={featuredBook}
                  to={routeBuilders.book(featuredBook.id)}
                  title={featuredBook.title}
                  author={getAuthorNames(featuredBook)}
                  coverSrc={featuredBook.cover || featuredBook.cover_fallback_url}
                  variant="featured"
                  size="compact"
                />
                {heroBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    to={routeBuilders.book(book.id)}
                    title={book.title}
                    author={getAuthorNames(book)}
                    coverSrc={book.cover || book.cover_fallback_url}
                    variant="trending"
                    size="compact"
                  />
                ))}
              </>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3" aria-label="BookNest discovery features">
        {valueCards.map((card) => (
          <article key={card.id} className="glass-card card-lift p-5">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-black text-accent">
              <span aria-hidden="true" className="text-lg font-bold">{card.title.slice(0, 1)}</span>
            </div>
            <h2 className="text-lg font-bold text-primary-white">{card.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-primary-gray">{card.copy}</p>
          </article>
        ))}
      </section>

      <section className="flex flex-col gap-5" aria-labelledby="trending-title">
        <h2 id="trending-title" className="text-2xl font-bold text-primary-white">Trending on BookNest</h2>
        <Swiper
          modules={[Pagination, A11y, Autoplay]}
          slidesPerView={1}
          spaceBetween={20}
          pagination={{ clickable: true }}
          autoplay={{ delay: 3000, disableOnInteraction: false }}
          breakpoints={{ 640: { slidesPerView: 2 }, 1024: { slidesPerView: 4 } }}
          className="landing-trending-swiper w-full"
        >
          {carouselBooks.map((book) => (
            <SwiperSlide key={book.id}>
              <BookCard
                book={book}
                to={routeBuilders.book(book.id)}
                title={book.title}
                author={getAuthorNames(book)}
                coverSrc={book.cover || book.cover_fallback_url}
                variant="trending"
                size="small"
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

    </div>
  );
}

export default function Landing(): ReactElement | null {
  const { user, token } = useOptionalAuth();
  return user ? <SignedInLanding token={token} /> : <GuestLanding />;
}
