import type { ReactElement } from "react";
import { A11y, Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { BookCard } from "../../../../components/ui";
import { routeBuilders } from "../../../../routes/paths";
import type { ReadingList } from "../../../collections/types/collection";
import type { Book } from "../../../catalog/types/book";
import { getAuthorNames } from "../../../catalog/utils/bookFacets";
import { DeleteBookButton } from "./DeleteBookButton";

export interface BookShelfCarouselProps {
  books: Book[];
  navigationClass: string;
  primaryCollection?: ReadingList | undefined;
  canDelete: boolean;
  isDeleting: boolean;
  onDeleteBook?: ((bookId: string | undefined, listId: number | null) => void) | undefined;
}

export function BookShelfCarousel({
  books,
  navigationClass,
  primaryCollection,
  canDelete,
  isDeleting,
  onDeleteBook,
}: BookShelfCarouselProps): ReactElement {
  return (
    <Swiper
      modules={[Navigation, Pagination, A11y, Autoplay]}
      spaceBetween={20}
      slidesPerView={1}
      navigation={{ prevEl: `.${navigationClass}-prev`, nextEl: `.${navigationClass}-next` }}
      pagination={{ clickable: true }}
      autoplay={{ delay: 3200, disableOnInteraction: false }}
      breakpoints={{ 640: { slidesPerView: 2 }, 1024: { slidesPerView: 4 } }}
      className="w-full"
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
      <div className={`swiper-button-prev ${navigationClass}-prev`} />
      <div className={`swiper-button-next ${navigationClass}-next`} />
    </Swiper>
  );
}
