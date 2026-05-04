import type { ReactElement } from "react";
import { A11y, Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { BookCard } from "../../../../components/ui";
import { routeBuilders } from "../../../../routes/paths";
import { popularBooks } from "../../data/exploreData";
import { getAuthorNames } from "../../utils/bookFacets";

export interface RelatedBooksCarouselProps {
  currentBookId?: string | undefined;
}

export function RelatedBooksCarousel({
  currentBookId,
}: RelatedBooksCarouselProps): ReactElement {
  const relatedBooks = popularBooks
    .filter((book) => book.isbn13 !== currentBookId)
    .slice(0, 8);

  return (
    <section className="flex flex-col gap-5" aria-labelledby="related-books-title">
      <h2 id="related-books-title" className="text-xl font-bold text-primary-white">
        Related Books
      </h2>
      <Swiper
        modules={[Pagination, A11y, Autoplay]}
        slidesPerView={1}
        spaceBetween={20}
        pagination={{ clickable: true }}
        autoplay={{ delay: 3300, disableOnInteraction: false }}
        breakpoints={{ 640: { slidesPerView: 2 }, 1024: { slidesPerView: 4 } }}
        className="w-full"
      >
        {relatedBooks.map((book) => (
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
    </section>
  );
}
