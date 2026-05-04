import type { ReactElement } from "react";
import { Link } from "react-router-dom";
import { A11y, Autoplay, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { routeBuilders } from "../../../../routes/paths";
import type { CatalogGenre } from "../../types/book";
import { SectionTitle } from "./SectionTitle";

export interface GenreCarouselProps {
  categories: CatalogGenre[];
}

export function GenreCarousel({ categories }: GenreCarouselProps): ReactElement {
  return (
    <section className="flex flex-col gap-5" aria-labelledby="popular-genres">
      <SectionTitle id="popular-genres">Popular Genres</SectionTitle>
      <Swiper
        modules={[Navigation, A11y, Autoplay]}
        spaceBetween={16}
        slidesPerView={1}
        navigation={{ prevEl: ".explore-genres-prev", nextEl: ".explore-genres-next" }}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        breakpoints={{
          640: { slidesPerView: 2, spaceBetween: 16 },
          1024: { slidesPerView: 3, spaceBetween: 20 },
          1280: { slidesPerView: 4, spaceBetween: 24 },
        }}
        className="w-full"
      >
        {categories.map((category) => (
          <SwiperSlide key={category.id}>
            <Link
              to={routeBuilders.searchQuery(category.name)}
              className="glass-card card-lift flex min-h-[56px] items-center justify-center px-4 py-2 text-center text-base font-semibold text-primary-white"
            >
              {category.name}
            </Link>
          </SwiperSlide>
        ))}
        <div className="swiper-button-prev explore-genres-prev" />
        <div className="swiper-button-next explore-genres-next" />
      </Swiper>
    </section>
  );
}
