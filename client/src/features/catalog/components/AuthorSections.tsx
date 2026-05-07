import type { ReactElement } from "react";
import { A11y, Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { BookCard, EmptyState } from "../../../components/ui";
import { routeBuilders, routePaths } from "../../../routes/paths";
import { getFallbackHueStyle, getInitials } from "../../../utils/colorFromString";
import type { Author, Book } from "../types/book";
import { getAuthorNames } from "../utils/bookFacets";

interface AuthorHeaderProps {
  author: Author;
  isLiked: boolean;
  onToggleLike: () => void;
}

export function AuthorHeader({
  author,
  isLiked,
  onToggleLike,
}: AuthorHeaderProps): ReactElement {
  return (
    <section className="flex flex-col items-center gap-6 md:flex-row md:items-end">
      <div
        className="fallback-gradient flex aspect-square w-64 items-center justify-center overflow-hidden rounded-xl px-6 text-center text-6xl font-bold text-primary-white shadow-xl"
        style={getFallbackHueStyle(author.name)}
      >
        <span aria-hidden="true">{getInitials(author.name)}</span>
        <span className="sr-only">Portrait unavailable for {author.name}</span>
      </div>
      <div className="flex flex-col items-center gap-4 md:items-start">
        <h1 className="display-heading text-4xl md:text-5xl">
          {author.name}
        </h1>
        {typeof author.number_of_books === "number" ? (
          <p className="text-sm text-primary-gray">
            {author.number_of_books} books in BookNest
          </p>
        ) : null}
        <button
          type="button"
          onClick={onToggleLike}
          className={`btn inline-flex min-h-[44px] items-center justify-center px-5 py-2 text-sm font-medium shadow-md hover:-translate-y-0.5 hover:shadow-lg ${
            isLiked ? "btn-primary-v" : "btn-accent-v"
          }`}
          aria-pressed={isLiked}
          aria-label={`Like ${author.name}'s profile`}
        >
          {isLiked ? "Liked" : "Like"}
        </button>
      </div>
    </section>
  );
}

interface AuthorBioProps {
  author: Author;
}

export function AuthorBio({ author }: AuthorBioProps): ReactElement {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="author-bio-title">
      <h2 id="author-bio-title" className="text-xl font-semibold text-primary-white">
        Bio
      </h2>
      <p className="max-w-2xl text-base leading-relaxed text-primary-white">
        {author.description || "No biography is available for this author yet."}
      </p>
    </section>
  );
}

interface AuthorBooksProps {
  books: Book[];
}

export function AuthorBooks({ books }: AuthorBooksProps): ReactElement {
  return (
    <section className="flex flex-col gap-5" aria-labelledby="author-books-title">
      <h2 id="author-books-title" className="text-xl font-semibold text-primary-white sm:text-2xl">
        Author Books
      </h2>
      {books.length === 0 ? (
        <EmptyState
          title="No books listed yet"
          description="This author's books will appear here when they are available."
          actionLabel="Browse books"
          actionTo={routePaths.explore}
        />
      ) : (
        <Swiper
          modules={[Pagination, A11y, Autoplay]}
          spaceBetween={20}
          slidesPerView={1}
          pagination={{ clickable: true }}
          autoplay={{ delay: 3000, disableOnInteraction: false }}
          breakpoints={{
            640: { slidesPerView: 2, spaceBetween: 20 },
            1024: { slidesPerView: 3, spaceBetween: 24 },
            1280: { slidesPerView: 4, spaceBetween: 28 },
          }}
          className="w-full relative"
        >
          {books.map((book) => (
            <SwiperSlide key={book.isbn13}>
            <BookCard
                to={routeBuilders.book(book.isbn13)}
                title={book.title}
                author={getAuthorNames(book)}
                coverSrc={book.cover_img}
                rating={book.average_rate}
                variant="trending"
              />
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </section>
  );
}
