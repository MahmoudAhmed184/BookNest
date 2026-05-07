import type { ReactElement } from "react";
import { A11y, Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { BookCard } from "../../../../components/ui";
import { routeBuilders } from "../../../../routes/paths";
import type { ReadingList } from "../../../collections/types/collection";
import type { Book } from "../../../catalog/types/book";
import { getAuthorNames } from "../../../catalog/utils/bookFacets";
import { DeleteBookButton } from "./DeleteBookButton";

export interface BookShelfCarouselProps {
  books: Book[];
  primaryCollection?: ReadingList | undefined;
  canDelete: boolean;
  isDeleting: boolean;
  onDeleteBook?: ((book: Book, listId: number | null) => void) | undefined;
}

export function BookShelfCarousel({
  books,
  primaryCollection,
  canDelete,
  isDeleting,
  onDeleteBook,
}: BookShelfCarouselProps): ReactElement {
  return (
    <Swiper
      modules={[Pagination, A11y, Autoplay]}
      spaceBetween={20}
      slidesPerView={1}
      pagination={{ clickable: true }}
      autoplay={{ delay: 3200, disableOnInteraction: false }}
      breakpoints={{ 640: { slidesPerView: 2 }, 1024: { slidesPerView: 4 } }}
      className="book-carousel-swiper w-full"
    >
      {books.map((book) => (
        <SwiperSlide key={book.isbn13}>
          <div className="relative pr-2 pt-2">
            <BookCard
              to={routeBuilders.book(book.isbn13)}
              title={book.title}
              author={getAuthorNames(book)}
              coverSrc={book.cover_img}
            />
            {canDelete && onDeleteBook ? (
              <DeleteBookButton
                book={book}
                listId={primaryCollection?.list_id ?? null}
                isDeleting={isDeleting}
                onDeleteBook={onDeleteBook}
              />
            ) : null}
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
