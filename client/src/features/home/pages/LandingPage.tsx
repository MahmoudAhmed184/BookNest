import type { ReactElement } from "react";
import { Link } from "react-router-dom";
import { A11y, Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { BookCard } from "../../../components/ui";
import { routeBuilders, routePaths } from "../../../routes/paths";
import { popularBooks } from "../../catalog/data/exploreData";
import { getAuthorNames } from "../../catalog/utils/bookFacets";

const valueCards = [
  { id: "mood", title: "Mood-led discovery", copy: "Browse by tone, pace, and the feeling you want your next read to leave behind." },
  { id: "shelf", title: "Living collections", copy: "Shape reading lists that feel like shelves, projects, and recommendations in one place." },
  { id: "social", title: "Reader signals", copy: "Use ratings and thoughtful reviews to find books with real community texture." },
] as const;

export default function Landing(): ReactElement | null {
  const featuredBook = popularBooks.find((book) => book.title === "1984") ?? popularBooks[0];
  if (!featuredBook) return null;

  return (
    <div className="flex flex-col gap-16 py-10">
      <section
        className="relative min-h-[calc(100vh-8rem)] overflow-hidden rounded-xl py-8"
        aria-labelledby="landing-title"
      >
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,color-mix(in_srgb,var(--color-accent)_20%,transparent),transparent_28%),radial-gradient(circle_at_80%_70%,color-mix(in_srgb,var(--mood-hopeful)_14%,transparent),transparent_32%)]"
          aria-hidden="true"
        />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_1.15fr] lg:items-center">
          <div className="flex flex-col gap-6">
            <div className="animate-fade-up flex flex-col gap-4">
              <h1 id="landing-title" className="display-heading">
                Discover Your Next Favorite Book
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-primary-gray md:text-lg">
                Track what you read, follow the feeling of each story, and
                uncover shelves that match your taste.
              </p>
            </div>
            <div className="animate-fade-up flex flex-wrap gap-3" style={{ animationDelay: "100ms" }}>
              <Link
                to={routePaths.login}
                className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center px-5 py-2 text-sm font-medium text-primary-white shadow-md hover:-translate-y-0.5 hover:shadow-lg sm:px-6 sm:py-3 sm:text-base"
              >
                Get Started
              </Link>
              <Link
                to={routePaths.explore}
                className="btn btn-primary-v inline-flex min-h-[44px] items-center justify-center px-5 py-2 text-sm font-medium text-primary-white shadow-md hover:-translate-y-0.5 hover:shadow-lg sm:px-6 sm:py-3 sm:text-base"
              >
                Explore Now
              </Link>
            </div>
          </div>
          <div className="bento-grid animate-fade-up" style={{ animationDelay: "200ms" }}>
            <BookCard
              to={routeBuilders.book(featuredBook.isbn13)}
              title={featuredBook.title}
              author={getAuthorNames(featuredBook)}
              coverSrc={featuredBook.cover_img}
              variant="featured"
              className="md:col-span-2 md:row-span-2"
            />
            {popularBooks.slice(0, 3).map((book) => (
              <BookCard
                key={book.isbn13}
                to={routeBuilders.book(book.isbn13)}
                title={book.title}
                author={getAuthorNames(book)}
                coverSrc={book.cover_img}
                variant="trending"
              />
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3" aria-label="BookNest discovery features">
        {valueCards.map((card) => (
          <article key={card.id} className="glass-card card-lift p-5">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-black text-accent">
              <span aria-hidden="true" className="text-lg font-bold">{card.title.slice(0, 1)}</span>
            </div>
            <h2 className="text-lg font-bold text-primary-white">{card.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-primary-gray">{card.copy}</p>
          </article>
        ))}
      </section>

      <section className="flex flex-col gap-5" aria-labelledby="trending-title">
        <h2 id="trending-title" className="text-2xl font-bold text-primary-white">Trending on BookNest</h2>
        <Swiper
          modules={[Pagination, A11y, Autoplay]}
          slidesPerView={1}
          spaceBetween={20}
          pagination={{ clickable: true }}
          autoplay={{ delay: 3000, disableOnInteraction: false }}
          breakpoints={{ 640: { slidesPerView: 2 }, 1024: { slidesPerView: 4 } }}
          className="w-full"
        >
          {popularBooks.slice(3, 11).map((book) => (
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

      <section className="glass-card flex flex-col items-start gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <h2 className="max-w-2xl text-3xl font-extrabold text-primary-white text-balance">
          Build a shelf that remembers why every book mattered.
        </h2>
        <Link to={routePaths.explore} className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center px-6 py-3">
          Start Discovering
        </Link>
      </section>
    </div>
  );
}
