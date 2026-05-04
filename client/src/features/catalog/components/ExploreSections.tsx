import type { ReactElement } from "react";
import { Link } from "react-router-dom";
import { A11y, Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { BookCard } from "../../../components/BookCard";
import { BookCardSkeleton } from "../../../components/BookCardSkeleton";
import { EmptyState } from "../../../components/EmptyState";
import { ErrorState } from "../../../components/ErrorState";
import { routeBuilders, routePaths } from "../../../routes";
import type { Book, RecommendedBook } from "../../../types/book";
import type { CatalogCategory } from "../data/exploreData";

interface SectionTitleProps {
  id: string;
  children: string;
}

function SectionTitle({ id, children }: SectionTitleProps): ReactElement {
  return (
    <h2
      id={id}
      className="text-xl sm:text-2xl font-semibold text-primary-white text-balance"
    >
      {children}
    </h2>
  );
}

function SkeletonRow(): ReactElement {
  return (
    <div
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
      role="status"
      aria-live="polite"
    >
      {Array.from({ length: 4 }).map((_, index) => (
        <BookCardSkeleton key={index} />
      ))}
    </div>
  );
}

interface GenreCarouselProps {
  categories: CatalogCategory[];
}

export function GenreCarousel({ categories }: GenreCarouselProps): ReactElement {
  return (
    <section className="flex flex-col gap-5" aria-labelledby="popular-genres">
      <SectionTitle id="popular-genres">Popular Genres</SectionTitle>
      <Swiper
        modules={[Navigation, A11y, Autoplay]}
        spaceBetween={16}
        slidesPerView={1}
        navigation={{
          prevEl: ".explore-genres-prev",
          nextEl: ".explore-genres-next",
        }}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        breakpoints={{
          640: { slidesPerView: 2, spaceBetween: 16 },
          1024: { slidesPerView: 3, spaceBetween: 20 },
          1280: { slidesPerView: 4, spaceBetween: 24 },
        }}
        className="w-full relative"
      >
        {categories.map((category) => (
          <SwiperSlide key={category.id}>
            <Link
              to={routeBuilders.searchQuery(category.title)}
              title={`Browse ${category.title} books`}
              className="flex min-h-[56px] items-center justify-center rounded-full bg-secondary-black px-4 py-2 text-center text-base font-medium text-primary-white shadow-md transition-all duration-200 ease-out hover:-translate-y-1 hover:bg-secondary-gray hover:shadow-lg focus-visible:outline-accent"
            >
              {category.title}
            </Link>
          </SwiperSlide>
        ))}
        <div className="swiper-button-prev explore-genres-prev"></div>
        <div className="swiper-button-next explore-genres-next"></div>
      </Swiper>
    </section>
  );
}

interface RecommendationsSectionProps {
  recommendations: RecommendedBook[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function RecommendationsSection({
  recommendations,
  isLoading,
  isFetching,
  isError,
  onRetry,
}: RecommendationsSectionProps): ReactElement {
  return (
    <section className="flex flex-col gap-5" aria-labelledby="recommended-books">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionTitle id="recommended-books">Recommended For You</SectionTitle>
        {isFetching && recommendations.length > 0 ? (
          <p className="text-xs text-primary-gray" role="status">
            Updating recommendations...
          </p>
        ) : null}
      </div>
      {isLoading ? <SkeletonRow /> : null}
      {isError ? (
        <ErrorState
          title="Recommendations are unavailable"
          message="We could not load your recommendations right now."
          onRetry={onRetry}
          isRetrying={isFetching}
        />
      ) : null}
      {!isLoading && !isError && recommendations.length === 0 ? (
        <EmptyState
          title="Recommendations are warming up"
          description="Rate more books to unlock personalized recommendations that match your reading taste."
          actionLabel="Browse books"
          actionTo={routePaths.search}
        />
      ) : null}
      {!isLoading && !isError && recommendations.length > 0 ? (
        <BookCarousel
          items={recommendations}
          navigationClass="explore-recommendations"
          renderBook={(book) => (
            <BookCard
              to={routeBuilders.book(book.book)}
              title={book.book_title}
              coverSrc={book.book_cover}
              showAuthor={false}
            />
          )}
        />
      ) : null}
    </section>
  );
}

interface ExploreBooksSectionProps {
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
          <p className="text-xs text-primary-gray" role="status">
            Updating books...
          </p>
        ) : null}
      </div>
      {isLoading ? <SkeletonRow /> : null}
      {isError ? (
        <ErrorState
          title="Books could not be loaded"
          message="We could not load this book shelf. Please try again."
          onRetry={onRetry}
          isRetrying={isFetching}
        />
      ) : null}
      {!isLoading && !isError && books.length === 0 ? (
        <EmptyState
          title="No books found yet"
          description="Try searching for a genre, author, or title to keep exploring."
          actionLabel="Search books"
          actionTo={routePaths.search}
        />
      ) : null}
      {!isLoading && !isError && books.length > 0 ? (
        <BookCarousel
          items={books}
          navigationClass="explore-books"
          renderBook={(book) => (
            <BookCard
              to={routeBuilders.book(book.isbn13)}
              title={book.title}
              author={book.author}
              coverSrc={book.cover_img}
            />
          )}
        />
      ) : null}
    </section>
  );
}

interface PopularBooksGridProps {
  books: Book[];
}

export function PopularBooksGrid({ books }: PopularBooksGridProps): ReactElement {
  return (
    <section className="flex flex-col gap-5" aria-labelledby="popular-books">
      <SectionTitle id="popular-books">Popular Books</SectionTitle>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {books.map((book) => (
          <BookCard
            key={book.isbn13}
            to={routeBuilders.book(book.isbn13)}
            title={book.title}
            author={book.authors?.join(", ")}
            coverSrc={book.cover_img}
          />
        ))}
      </div>
    </section>
  );
}

interface BookCarouselProps<TItem> {
  items: TItem[];
  navigationClass: string;
  renderBook: (item: TItem) => ReactElement;
}

function BookCarousel<TItem>({
  items,
  navigationClass,
  renderBook,
}: BookCarouselProps<TItem>): ReactElement {
  return (
    <Swiper
      modules={[Navigation, Pagination, A11y, Autoplay]}
      spaceBetween={20}
      slidesPerView={1}
      navigation={{
        prevEl: `.${navigationClass}-prev`,
        nextEl: `.${navigationClass}-next`,
      }}
      pagination={{ clickable: true }}
      autoplay={{ delay: 3000, disableOnInteraction: false }}
      breakpoints={{
        640: { slidesPerView: 2, spaceBetween: 20 },
        1024: { slidesPerView: 3, spaceBetween: 24 },
        1280: { slidesPerView: 4, spaceBetween: 28 },
      }}
      className="w-full relative"
    >
      {items.map((item, index) => (
        <SwiperSlide key={index}>{renderBook(item)}</SwiperSlide>
      ))}
      <div className={`swiper-button-prev ${navigationClass}-prev`}></div>
      <div className={`swiper-button-next ${navigationClass}-next`}></div>
    </Swiper>
  );
}
