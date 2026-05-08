import type { ReactElement } from "react";
import { A11y, Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { BookCard } from "../../../../components/ui";
import { routeBuilders } from "../../../../routes/paths";
import type {
  CollectionBook,
  ReadingCollection,
} from "../../../collections/types/collection";
import { getAuthorNames } from "../../../catalog/utils/bookFacets";
import { DeleteBookButton } from "./DeleteBookButton";

export interface BookShelfCarouselProps {
  items: CollectionBook[];
  primaryCollection?: ReadingCollection | undefined;
  canDelete: boolean;
  isDeleting: boolean;
  onDeleteBook?: ((item: CollectionBook) => void) | undefined;
}

export function BookShelfCarousel({
  items,
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
      {items.map((item) => {
        const book = item.book_detail;
        if (!book) return null;

        return (
        <SwiperSlide key={item.id}>
          <div className="relative pr-2 pt-2">
            <BookCard
              to={routeBuilders.book(book.id)}
              title={book.title}
              author={getAuthorNames(book)}
              coverSrc={book.cover || book.cover_fallback_url}
            />
            {canDelete && onDeleteBook ? (
              <DeleteBookButton
                item={item}
                collectionName={primaryCollection?.name}
                isDeleting={isDeleting}
                onDeleteBook={onDeleteBook}
              />
            ) : null}
          </div>
        </SwiperSlide>
      )})}
    </Swiper>
  );
}
