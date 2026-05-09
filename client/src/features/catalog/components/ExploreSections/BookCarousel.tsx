import type { ReactElement } from "react";
import { A11y, Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

export interface BookCarouselProps<TItem> {
  items: TItem[];
  renderBook: (item: TItem) => ReactElement | null;
  keyExtractor: (item: TItem) => string;
  autoplayDelay?: number;
}

export function BookCarousel<TItem>({
  items,
  renderBook,
  keyExtractor,
  autoplayDelay = 3200,
}: BookCarouselProps<TItem>): ReactElement {
  const isAutoplayEnabled = autoplayDelay > 0;

  return (
    <Swiper
      modules={isAutoplayEnabled ? [Pagination, A11y, Autoplay] : [Pagination, A11y]}
      spaceBetween={20}
      slidesPerView={1}
      slidesPerGroup={1}
      pagination={{ clickable: true }}
      autoplay={
        isAutoplayEnabled
          ? { delay: autoplayDelay, disableOnInteraction: false, pauseOnMouseEnter: true }
          : false
      }
      breakpoints={{
        640: { slidesPerView: 2, slidesPerGroup: 2, spaceBetween: 20 },
        1024: { slidesPerView: 3, slidesPerGroup: 3, spaceBetween: 24 },
        1280: { slidesPerView: 4, slidesPerGroup: 4, spaceBetween: 28 },
      }}
      className="book-carousel-swiper w-full"
    >
      {items.map((item) => (
        <SwiperSlide key={keyExtractor(item)}>{renderBook(item)}</SwiperSlide>
      ))}
    </Swiper>
  );
}
