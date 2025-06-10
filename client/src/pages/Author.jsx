import React from "react";
import ProfileImage from "/william_shakespere.jpg";
import { Link } from "react-router-dom";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, A11y, Autoplay } from "swiper/modules";

export default function Author() {
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
    <div className="container py-8 flex flex-col gap-8">
      <div className="flex flex-col items-center md:flex-row gap-4 md:items-end">
        <div className="w-64 md:w-64 aspect-square overflow-hidden rounded-lg bg-secondary-black">
          <img
            src={ProfileImage}
            alt="William Shakespeare profile image"
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold">William Shakespeare</h2>
          <button
            type="button"
            className="btn btn-accent-v px-4 py-2 text-sm font-medium rounded-md"
            aria-label="Like William Shakespeare's profile"
          >
            Like
          </button>
        </div>
      </div>
      <p className="text-base leading-relaxed">
        William Shakespeare (1564–1616) was an English playwright, poet, and
        actor, widely regarded as one of the greatest writers in the English
        language. His iconic plays, including <em>Hamlet</em>,{" "}
        <em>Romeo and Juliet</em>,<em>Macbeth</em>, and{" "}
        <em>A Midsummer Night's Dream</em>, explore themes of love, power,
        jealousy, betrayal, and the human condition. Known for rich language and
        complex characters, he wrote approximately 39 plays and 154 sonnets,
        profoundly influencing English literature and drama.
      </p>
      <h2 className="text-md sm:text-xl font-semibold">Author Books</h2>
      <Swiper
        modules={[Navigation, Pagination, A11y, Autoplay]}
        spaceBetween={20}
        slidesPerView={1}
        navigation={{
          prevEl: ".swiper-button-prev",
          nextEl: ".swiper-button-next",
        }}
        pagination={{ clickable: true }}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        breakpoints={{
          640: {
            slidesPerView: 2,
            spaceBetween: 20,
          },
          1024: {
            slidesPerView: 3,
            spaceBetween: 30,
          },
          1280: {
            slidesPerView: 4,
            spaceBetween: 40,
          },
        }}
        className="w-full relative"
      >
        {books.map((book) => (
          <SwiperSlide key={book.id}>
            <Link
              to={`/book/${book.id}`}
              className="group rounded-2xl shadow-md overflow-hidden relative block"
              style={{ pointerEvents: "auto" }}
            >
              {/* Blurred Background Image */}
              <div
                className="absolute inset-0 bg-secondary-black transition-opacity duration-300 opacity-100 group-hover:opacity-0 z-0"
                aria-hidden="true"
              />
              <img
                src={book.cover}
                className="absolute inset-0 w-full h-full object-cover blur-[100px] opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-0 peer"
                aria-hidden="true"
              />
              <figure className="flex flex-col justify-center items-center gap-4 sm:gap-5 p-4 sm:p-6 relative z-10">
                {/* Book Cover */}
                <div className="book-cover h-[256px] sm:h-[280px] relative">
                  <img
                    src={book.cover}
                    alt={`${book.title} cover`}
                    className="h-full w-full object-cover rounded-2xl relative transition-transform duration-300 group-hover:-translate-y-4 z-20 peer"
                  />
                </div>
                {/* Book Info */}
                <figcaption className="flex flex-col justify-center items-center gap-2 sm:gap-3">
                  <h4 className="text-base sm:text-lg text-primary-white font-semibold text-center line-clamp-1">
                    {book.title}
                  </h4>
                  <h5 className="text-sm sm:text-base text-primary-gray text-center">
                    {book.author}
                  </h5>
                  <div className="flex items-center">
                    <span className="text-yellow-400 text-sm sm:text-base">
                      {"★".repeat(Math.floor(book.rating))}
                      {book.rating % 1 !== 0 && "☆"}
                    </span>
                    <span className="text-primary-gray text-sm ml-2">
                      ({book.rating})
                    </span>
                  </div>
                </figcaption>
              </figure>
            </Link>
          </SwiperSlide>
        ))}
        {/* Custom Navigation Buttons */}
        <div className="swiper-button-prev"></div>
        <div className="swiper-button-next"></div>
      </Swiper>
    </div>
  );
}
