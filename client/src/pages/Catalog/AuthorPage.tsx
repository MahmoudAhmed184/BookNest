import { useState } from "react";
import ProfileImage from "/william_shakespere.jpg";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, A11y, Autoplay } from "swiper/modules";

import BookCard from "../../components/BookCard";
import EmptyState from "../../components/EmptyState";

export default function Author() {
  const [isLiked, setIsLiked] = useState(false);

  const books = [
    {
      id: 1,
      title: "The Great Gatsby",
      author: "F. Scott Fitzgerald",
      cover:
        "https://oku.ams3.cdn.digitaloceanspaces.com/covers/2022/08/3862d6e1202f427c0be0ca9ec891be82.jpg",
      rating: 4.5,
      description:
        "A story of wealth, love, and the American Dream in the Roaring Twenties.",
    },
    {
      id: 2,
      title: "To Kill a Mockingbird",
      author: "Harper Lee",
      cover:
        "https://oku.ams3.cdn.digitaloceanspaces.com/covers/2022/06/cf9c878d81fcf26ceaa350cbf77aa1f5.jpg",
      rating: 4.8,
      description:
        "A powerful tale of racial injustice and moral growth in the South.",
    },
    {
      id: 3,
      title: "1984",
      author: "George Orwell",
      cover:
        "https://oku.ams3.cdn.digitaloceanspaces.com/covers/2022/06/0be61269e4fc87209ac3e2a2ecab4abd.jpg",
      rating: 4.7,
      description: "A dystopian vision of totalitarianism and surveillance.",
    },
    {
      id: 4,
      title: "Pride and Prejudice",
      author: "Jane Austen",
      cover:
        "https://oku.ams3.cdn.digitaloceanspaces.com/covers/2022/08/3862d6e1202f427c0be0ca9ec891be82.jpg",
      rating: 4.6,
      description:
        "A witty romance exploring class, family, and personal growth.",
    },
    {
      id: 5,
      title: "Pride and Prejudice",
      author: "Jane Austen",
      cover:
        "https://oku.ams3.cdn.digitaloceanspaces.com/covers/2022/08/3862d6e1202f427c0be0ca9ec891be82.jpg",
      rating: 4.6,
      description:
        "A witty romance exploring class, family, and personal growth.",
    },
    {
      id: 6,
      title: "Pride and Prejudice",
      author: "Jane Austen",
      cover:
        "https://oku.ams3.cdn.digitaloceanspaces.com/covers/2022/08/3862d6e1202f427c0be0ca9ec891be82.jpg",
      rating: 4.6,
      description:
        "A witty romance exploring class, family, and personal growth.",
    },
  ];

  return (
    <div className="py-12 flex flex-col gap-12 animate-fade-up">
      <section className="flex flex-col items-center gap-6 md:flex-row md:items-end">
        <div className="w-64 aspect-square overflow-hidden rounded-xl bg-secondary-black shadow-xl">
          <img
            src={ProfileImage}
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
            onClick={() => setIsLiked((current) => !current)}
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

      <section className="flex flex-col gap-5" aria-labelledby="author-books-title">
        <h2 id="author-books-title" className="text-xl font-semibold text-primary-white sm:text-2xl">
          Author Books
        </h2>
        {books.length === 0 ? (
          <EmptyState
            title="No books listed yet"
            description="This author's books will appear here when they are available."
            actionLabel="Browse books"
            actionTo="/explore"
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
              <SwiperSlide key={book.id}>
                <BookCard
                  to={`/book/${book.id}`}
                  title={book.title}
                  author={book.author}
                  coverSrc={book.cover}
                  rating={book.rating}
                />
              </SwiperSlide>
            ))}
            <div className="swiper-button-prev author-books-prev"></div>
            <div className="swiper-button-next author-books-next"></div>
          </Swiper>
        )}
      </section>
    </div>
  );
}
