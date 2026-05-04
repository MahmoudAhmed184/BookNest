import type { ReactElement } from "react";
import { A11y, Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

export interface BookCarouselProps<TItem> {
  items: TItem[];
  navigationClass: string;
  renderBook: (item: TItem) => ReactElement | null;
  keyExtractor: (item: TItem) => string;
}

export function BookCarousel<TItem>({
  items,
  navigationClass,
  renderBook,
  keyExtractor,
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
      autoplay={{ delay: 3200, disableOnInteraction: false }}
      breakpoints={{
        640: { slidesPerView: 2, spaceBetween: 20 },
        1024: { slidesPerView: 3, spaceBetween: 24 },
        1280: { slidesPerView: 4, spaceBetween: 28 },
      }}
      className="w-full"
    >
      {items.map((item) => (
        <SwiperSlide key={keyExtractor(item)}>{renderBook(item)}</SwiperSlide>
      ))}
      <div className={`swiper-button-prev ${navigationClass}-prev`} />
      <div className={`swiper-button-next ${navigationClass}-next`} />
    </Swiper>
  );
}
