import type { ReactElement } from "react";
import { A11y, Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

export interface BookCarouselProps<TItem> {
  items: TItem[];
  renderBook: (item: TItem) => ReactElement | null;
  keyExtractor: (item: TItem) => string;
}

export function BookCarousel<TItem>({
  items,
  renderBook,
  keyExtractor,
}: BookCarouselProps<TItem>): ReactElement {
  return (
    <Swiper
      modules={[Pagination, A11y, Autoplay]}
      spaceBetween={20}
      slidesPerView={1}
      pagination={{ clickable: true }}
      autoplay={{ delay: 3200, disableOnInteraction: false }}
      breakpoints={{
        640: { slidesPerView: 2, spaceBetween: 20 },
        1024: { slidesPerView: 3, spaceBetween: 24 },
        1280: { slidesPerView: 4, spaceBetween: 28 },
      }}
      className="book-carousel-swiper w-full"
    >
      {items.map((item) => (
        <SwiperSlide key={keyExtractor(item)}>{renderBook(item)}</SwiperSlide>
      ))}
    </Swiper>
  );
}
