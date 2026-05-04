import type { ReactElement } from "react";
import { A11y, Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { BookCard, BookCardSkeleton, ErrorState } from "../../../../components/ui";
import { routeBuilders } from "../../../../routes/paths";
import { useRelatedBooks } from "../../hooks/useRelatedBooks";
import { getAuthorNames } from "../../utils/bookFacets";

export interface RelatedBooksCarouselProps {
  currentBookId?: string | undefined;
}

export function RelatedBooksCarousel({
  currentBookId,
}: RelatedBooksCarouselProps): ReactElement {
  const { books, isLoading, isFetching, isError, refetch } = useRelatedBooks(currentBookId);

  return (
    <section className="flex flex-col gap-5" aria-labelledby="related-books-title">
      <h2 id="related-books-title" className="text-xl font-bold text-primary-white">
        Related Books
      </h2>
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" role="status" aria-live="polite">
          {["related-1", "related-2", "related-3", "related-4"].map((key) => (
            <BookCardSkeleton key={key} />
          ))}
        </div>
      ) : null}
      {isError ? (
        <ErrorState
          title="Related books could not be loaded"
          message="We could not load related books right now."
          onRetry={refetch}
          isRetrying={isFetching}
        />
      ) : null}
      {!isLoading && !isError && books.length > 0 ? (
        <Swiper
          modules={[Pagination, A11y, Autoplay]}
          slidesPerView={1}
          spaceBetween={20}
          pagination={{ clickable: true }}
          autoplay={{ delay: 3300, disableOnInteraction: false }}
          breakpoints={{ 640: { slidesPerView: 2 }, 1024: { slidesPerView: 4 } }}
          className="w-full"
        >
          {books.map((book) => (
            <SwiperSlide key={book.isbn13}>
              <BookCard
                to={routeBuilders.book(book.isbn13)}
                title={book.title}
                author={getAuthorNames(book)}
                coverSrc={book.cover_img}
                variant="trending"
              />
            </SwiperSlide>
          ))}
        </Swiper>
      ) : null}
    </section>
  );
}
