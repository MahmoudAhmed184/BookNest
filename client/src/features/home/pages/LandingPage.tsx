import type { ReactElement } from "react";
import { Link } from "react-router-dom";
import { A11y, Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { BookCard, BookCardSkeleton, EmptyState, ErrorState } from "../../../components/ui";
import { routeBuilders, routePaths } from "../../../routes/paths";
import { useLandingCatalog } from "../../catalog/hooks/useLandingCatalog";
import { getAuthorNames } from "../../catalog/utils/bookFacets";

const valueCards = [
  { id: "genres", title: "Guided discovery", copy: "Browse by genre, author, and community signals without losing the full catalog context." },
  { id: "shelf", title: "Living collections", copy: "Shape reading collections that feel like shelves, projects, and recommendations in one place." },
  { id: "social", title: "Reader signals", copy: "Use ratings and thoughtful reviews to find books with real community texture." },
] as const;

export default function Landing(): ReactElement | null {
  const { books, featuredBook, isLoading, isFetching, isError, refetch } = useLandingCatalog();
  const heroBooks = books.slice(1, 5);
  const carouselBooks = books.slice(5, 13);
  const shouldStretchLastHeroBook = heroBooks.length === 3;

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
          <div className="bento-grid animate-fade-up" style={{ animationDelay: "200ms" }}>
            {isLoading ? (
              <>
                <BookCardSkeleton className="md:col-span-2 md:row-span-2" />
                <BookCardSkeleton />
                <BookCardSkeleton />
                <BookCardSkeleton />
                <BookCardSkeleton />
              </>
            ) : null}
            {isError ? (
              <div className="md:col-span-2">
                <ErrorState
                  title="Featured books could not be loaded"
                  message="We could not load the discovery shelf right now."
                  onRetry={refetch}
                  isRetrying={isFetching}
                />
              </div>
            ) : null}
            {!isLoading && !isError && !featuredBook ? (
              <div className="md:col-span-2">
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
                  to={routeBuilders.book(featuredBook.id)}
                  title={featuredBook.title}
                  author={getAuthorNames(featuredBook)}
                  coverSrc={featuredBook.cover || featuredBook.cover_fallback_url}
                  variant="featured"
                  className="md:col-span-2 md:row-span-2"
                />
                {heroBooks.map((book, index) => (
                  <BookCard
                    key={book.id}
                    to={routeBuilders.book(book.id)}
                    title={book.title}
                    author={getAuthorNames(book)}
                    coverSrc={book.cover || book.cover_fallback_url}
                    variant="trending"
                    className={
                      shouldStretchLastHeroBook && index === heroBooks.length - 1
                        ? "lg:col-span-2"
                        : undefined
                    }
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
                to={routeBuilders.book(book.id)}
                title={book.title}
                author={getAuthorNames(book)}
                coverSrc={book.cover || book.cover_fallback_url}
                variant="trending"
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      <section className="glass-card flex flex-col items-start gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <h2 className="max-w-2xl text-3xl font-extrabold text-primary-white text-balance">
          Build a shelf that remembers why every book mattered.
        </h2>
        <Link to={routePaths.explore} className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center px-6 py-3">
          Start Discovering
        </Link>
      </section>
    </div>
  );
}
