import type { ReactElement } from "react";
import { A11y, Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { BookCard, EmptyState } from "../../../components/ui";
import { routeBuilders, routePaths } from "../../../routes/paths";
import type { Book } from "../types/book";

interface AuthorHeaderProps {
  isLiked: boolean;
  onToggleLike: () => void;
  profileImage: string;
}

export function AuthorHeader({
  isLiked,
  onToggleLike,
  profileImage,
}: AuthorHeaderProps): ReactElement {
  return (
    <section className="flex flex-col items-center gap-6 md:flex-row md:items-end">
      <div className="w-64 aspect-square overflow-hidden rounded-xl bg-secondary-black shadow-xl">
        <img
          src={profileImage}
          alt="Portrait of William Shakespeare"
          className="h-full w-full object-cover transition-transform duration-200 ease-out hover:scale-[1.03]"
          width="256"
          height="256"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="flex flex-col items-center gap-4 md:items-start">
        <h1 className="text-3xl font-semibold text-primary-white text-balance">
          William Shakespeare
        </h1>
        <button
          type="button"
          onClick={onToggleLike}
          className={`btn inline-flex min-h-[44px] items-center justify-center px-5 py-2 text-sm font-medium shadow-md hover:-translate-y-0.5 hover:shadow-lg ${
            isLiked ? "btn-primary-v" : "btn-accent-v"
          }`}
          aria-pressed={isLiked}
          aria-label="Like William Shakespeare's profile"
        >
          {isLiked ? "Liked" : "Like"}
        </button>
      </div>
    </section>
  );
}

export function AuthorBio(): ReactElement {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="author-bio-title">
      <h2 id="author-bio-title" className="text-xl font-semibold text-primary-white">
        Bio
      </h2>
      <p className="max-w-2xl text-base leading-relaxed text-primary-white">
        William Shakespeare (1564-1616) was an English playwright, poet, and
        actor, widely regarded as one of the greatest writers in the English
        language. His iconic plays, including <em>Hamlet</em>,{" "}
        <em>Romeo and Juliet</em>, <em>Macbeth</em>, and{" "}
        <em>A Midsummer Night's Dream</em>, explore themes of love, power,
        jealousy, betrayal, and the human condition. Known for rich language and
        complex characters, he wrote approximately 39 plays and 154 sonnets,
        profoundly influencing English literature and drama.
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
          modules={[Navigation, Pagination, A11y, Autoplay]}
          spaceBetween={20}
          slidesPerView={1}
          navigation={{
            prevEl: ".author-books-prev",
            nextEl: ".author-books-next",
          }}
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
                author={book.author}
                coverSrc={book.cover_img}
                rating={book.average_rate}
              />
            </SwiperSlide>
          ))}
          <div className="swiper-button-prev author-books-prev"></div>
          <div className="swiper-button-next author-books-next"></div>
        </Swiper>
      )}
    </section>
  );
}
