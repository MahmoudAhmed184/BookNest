import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, A11y, Autoplay } from "swiper/modules";
import { Link } from "react-router-dom";
import { getBooks, getRecommendedBooks } from "../services/bookService";

export default function Explore() {
  const {
    data: booksData,
    isLoading: isBooksLoading,
    isError: isBooksError,
    error: booksError,
  } = useQuery({
    queryKey: ["books", "python"],
    queryFn: () => getBooks("python"),
  });

  const {
    data: recommendationsData,
    isLoading: isRecommendationsLoading,
    isError: isRecommendationsError,
    error: recommendationsError,
  } = useQuery({
    queryKey: ["recommendations"],
    queryFn: getRecommendedBooks,
  });

  const books = booksData?.results || [];
  const recommendations = recommendationsData || [];

  if (isBooksLoading || isRecommendationsLoading) {
    return (
      <div className="flex-grow flex justify-center items-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (isBooksError || isRecommendationsError) {
    return (
      <div className="error">
        {isBooksError && <p>Error fetching books: {booksError.message}</p>}
        {isRecommendationsError && (
          <p>Error fetching recommendations: {recommendationsError.message}</p>
        )}
      </div>
    );
  }

  const popularBooks = [
    {
      title: "Clean Code",
      authors: ["Robert C. Martin"],
      language: "English",
      date: "2008-08-11",
      isbn13: "9780132350884",
      cover_img: "https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg",
    },
    {
      title: "Rich Dad Poor Dad",
      authors: ["Robert T. Kiyosaki"],
      language: "English",
      date: "1997-04-01",
      isbn13: "9781612680194",
      cover_img: "https://covers.openlibrary.org/b/isbn/9781612680194-L.jpg",
    },
    {
      title: "Atomic Habits",
      authors: ["James Clear"],
      language: "English",
      date: "2018-10-16",
      isbn13: "9781804225783",
      cover_img: "https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg",
    },
    {
      title: "1984",
      authors: ["George Orwell"],
      language: "English",
      date: "1949-06-08",
      isbn13: "9780451524935",
      cover_img: "https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg",
    },
    {
      title: "The Psychology of Money",
      authors: ["Morgan Housel"],
      language: "English",
      date: "2020-09-08",
      isbn13: "9780857197689",
      cover_img: "https://m.media-amazon.com/images/I/81wZXiu4OiL._SY466_.jpg",
    },
    {
      title: "Sapiens",
      authors: ["Yuval Noah Harari"],
      language: "English",
      date: "2015-02-10",
      isbn13: "9780062316097",
      cover_img: "https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg",
    },
    {
      title: "The Subtle Art of Not Giving a F*ck",
      authors: ["Mark Manson"],
      language: "English",
      date: "2016-09-13",
      isbn13: "9780062457714",
      cover_img: "https://covers.openlibrary.org/b/isbn/9780062457714-L.jpg",
    },
    {
      title: "Educated",
      authors: ["Tara Westover"],
      language: "English",
      date: "2018-02-20",
      isbn13: "9780399590504",
      cover_img: "https://covers.openlibrary.org/b/isbn/9780399590504-L.jpg",
    },
    {
      title: "Thinking, Fast and Slow",
      authors: ["Daniel Kahneman"],
      language: "English",
      date: "2011-10-25",
      isbn13: "9780374275631",
      cover_img: "https://covers.openlibrary.org/b/isbn/9780374275631-L.jpg",
    },
    {
      title: "The Power of Habit",
      authors: ["Charles Duhigg"],
      language: "English",
      date: "2012-02-28",
      isbn13: "9780812981605",
      cover_img: "https://covers.openlibrary.org/b/isbn/9780812981605-L.jpg",
    },
    {
      title: "Start with Why",
      authors: ["Simon Sinek"],
      language: "English",
      date: "2009-10-29",
      isbn13: "9781591846444",
      cover_img: "https://covers.openlibrary.org/b/isbn/9781591846444-L.jpg",
    },
    {
      title: "The Lean Startup",
      authors: ["Eric Ries"],
      language: "English",
      date: "2011-09-13",
      isbn13: "9780307887894",
      cover_img: "https://covers.openlibrary.org/b/isbn/9780307887894-L.jpg",
    },
    {
      title: "The Pragmatic Programmer",
      authors: ["Andrew Hunt", "David Thomas"],
      language: "English",
      date: "1999-10-30",
      isbn13: "9780201616224",
      cover_img: "https://covers.openlibrary.org/b/isbn/9780201616224-L.jpg",
    },
    {
      title: "Introduction to Algorithms",
      authors: [
        "Thomas H. Cormen",
        "Charles E. Leiserson",
        "Ronald L. Rivest",
        "Clifford Stein",
      ],
      language: "English",
      date: "2009-07-31",
      isbn13: "9780262033848",
      cover_img: "https://covers.openlibrary.org/b/isbn/9780262033848-L.jpg",
    },
    {
      title: "The Body Keeps the Score",
      authors: ["Bessel van der Kolk"],
      language: "English",
      date: "2014-09-25",
      isbn13: "9780143127741",
      cover_img: "https://covers.openlibrary.org/b/isbn/9780143127741-L.jpg",
    },
    {
      title: "The Sixth Extinction",
      authors: ["Elizabeth Kolbert"],
      language: "English",
      date: "2014-02-11",
      isbn13: "9780805092998",
      cover_img: "https://covers.openlibrary.org/b/isbn/9780805092998-L.jpg",
    },
    {
      title: "Guns, Germs, and Steel",
      authors: ["Jared Diamond"],
      language: "English",
      date: "1997-03-01",
      isbn13: "9780393317558",
      cover_img: "https://covers.openlibrary.org/b/isbn/9780393317558-L.jpg",
    },
    {
      title: "A Brief History of Time",
      authors: ["Stephen Hawking"],
      language: "English",
      date: "1988-04-01",
      isbn13: "9780553380163",
      cover_img: "https://covers.openlibrary.org/b/isbn/9780553380163-L.jpg",
    },
    {
      title: "Deep Work",
      authors: ["Cal Newport"],
      language: "English",
      date: "2016-01-05",
      isbn13: "9781455586691",
      cover_img: "https://covers.openlibrary.org/b/isbn/9781455586691-L.jpg",
    },
    {
      title: "Range",
      authors: ["David Epstein"],
      language: "English",
      date: "2019-05-28",
      isbn13: "9780735214484",
      cover_img: "https://covers.openlibrary.org/b/isbn/9780735214484-L.jpg",
    },
    {
      title: "The Creative Act: A Way of Being",
      authors: ["Rick Rubin"],
      language: "English",
      date: "2023-01-17",
      isbn13: "9780593652886",
      cover_img: "https://covers.openlibrary.org/b/isbn/9780593652886-L.jpg",
    },
    {
      title: "Make Time",
      authors: ["Jake Knapp", "John Zeratsky"],
      language: "English",
      date: "2018-09-25",
      isbn13: "9780525572428",
      cover_img: "https://covers.openlibrary.org/b/isbn/9780525572428-L.jpg",
    },
    {
      title: "The Old Man and the Sea",
      authors: ["Ernest Hemingway"],
      language: "English",
      date: "1952-09-01",
      isbn13: "9780684801223",
      cover_img: "https://covers.openlibrary.org/b/isbn/9780684801223-L.jpg",
    },
    {
      title: "Black Beauty",
      authors: ["Anna Sewell"],
      language: "English",
      date: "1877-11-24",
      isbn13: "9781843650485",
      cover_img: "https://covers.openlibrary.org/b/id/5007492-L.jpg",
    },
    {
      title: "Journey to the Center of the Earth",
      authors: ["Jules Verne"],
      language: "English",
      date: "1864-11-25",
      isbn13: "9780451532152",
      cover_img: "https://covers.openlibrary.org/b/isbn/9780451532152-L.jpg",
    },
    {
      title: "Oliver Twist",
      authors: ["Charles Dickens"],
      language: "English",
      date: "1838-02-01",
      isbn13: "9780141439746",
      cover_img:
        "https://books.google.com/books/content?id=XIMyzQEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api",
    },
    {
      title: "The Iron Man",
      authors: ["Ted Hughes"],
      language: "English",
      date: "1968-01-01",
      isbn13: "9780571226122",
      cover_img: "https://covers.openlibrary.org/b/isbn/9780571226122-L.jpg",
    },
  ];
  const categories = [
    { id: 1, title: "Fiction" },
    { id: 2, title: "Non-Fiction" },
    { id: 3, title: "Mystery" },
    { id: 4, title: "Thriller" },
    { id: 5, title: "Romance" },
    { id: 6, title: "Science Fiction" },
    { id: 7, title: "Fantasy" },
    { id: 8, title: "Historical Fiction" },
    { id: 9, title: "Biography" },
    { id: 10, title: "Self-Help" },
    { id: 11, title: "Young Adult" },
    { id: 12, title: "Children’s" },
    { id: 13, title: "Horror" },
    { id: 14, title: "Poetry" },
    { id: 15, title: "Classics" },
  ];

  return (
    <div className="flex flex-col gap-md py-md">
      <h2 className="text-md sm:text-xl font-semibold">Popular Genres</h2>
      <Swiper
        modules={[Navigation, A11y, Autoplay]}
        spaceBetween={20}
        slidesPerView={1}
        navigation={{
          prevEl: ".swiper-button-prev",
          nextEl: ".swiper-button-next",
        }}
        pagination={{ clickable: true }}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        breakpoints={{
          640: { slidesPerView: 2, spaceBetween: 20 },
          1024: { slidesPerView: 3, spaceBetween: 30 },
          1280: { slidesPerView: 4, spaceBetween: 40 },
        }}
        className="w-full relative"
      >
        {categories.map((category) => (
          <SwiperSlide key={Math.random()}>
            <Link
              key={category?.id}
              to={`/search/${category?.title}`}
              className="bg-[#2D2D2D] hover:bg-[#3C3C3C] transition-colors duration-200 rounded-2xl p-4 flex items-center justify-center text-center"
            >
              <span className="text-[#F5F5F5] text-base font-medium">
                {category?.title}
              </span>
            </Link>
          </SwiperSlide>
        ))}
        <div className="swiper-button-prev"></div>
        <div className="swiper-button-next"></div>
      </Swiper>
      <h2 className="text-md sm:text-xl font-semibold">Recommended For You</h2>
      {recommendations?.length === 0 ? (
        <p className="text-base text-primary-gray">
          We need a bit more info to recommend books you'll love! Rate at least
          10 books to unlock personalized recommendations.
        </p>
      ) : (
        <>
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
              640: { slidesPerView: 2, spaceBetween: 20 },
              1024: { slidesPerView: 3, spaceBetween: 30 },
              1280: { slidesPerView: 4, spaceBetween: 40 },
            }}
            className="w-full relative"
          >
            {recommendations?.map((book) => (
              <SwiperSlide key={Math.random()}>
                <Link
                  to={`/book/${book?.book}`}
                  className="group rounded-2xl shadow-md overflow-hidden relative block"
                >
                  <div
                    className="absolute inset-0 bg-secondary-black transition-opacity duration-300 opacity-100 group-hover:opacity-0 z-0"
                    aria-hidden="true"
                  />
                  <img
                    src={
                      book?.book_cover ||
                      `https://dhmckee.com/wp-content/uploads/2018/11/defbookcover-min.jpg`
                    }
                    className="absolute inset-0 w-full h-full object-cover blur-[100px] opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-0 peer"
                    aria-hidden="true"
                    draggable={false}
                  />
                  <figure className="flex flex-col justify-center items-center gap-4 sm:gap-5 p-4 sm:p-6 relative z-10">
                    <div className="book-cover h-[256px] sm:h-[280px] relative">
                      <img
                        src={
                          book?.book_cover ||
                          `https://dhmckee.com/wp-content/uploads/2018/11/defbookcover-min.jpg`
                        }
                        alt={book?.book_title}
                        className="w-[180px] h-[280px] object-cover rounded-2xl relative transition-transform duration-300 group-hover:-translate-y-4 z-20 peer"
                      />
                    </div>
                    <figcaption className="flex flex-col justify-center items-center gap-2 sm:gap-3">
                      <h4 className="text-base sm:text-lg text-primary-white font-semibold text-center line-clamp-1">
                        {book?.book_title}
                      </h4>
                      {/* Optional additional info here */}
                    </figcaption>
                  </figure>
                </Link>
              </SwiperSlide>
            ))}
            <div className="swiper-button-prev"></div>
            <div className="swiper-button-next"></div>
          </Swiper>
        </>
      )}

      <h2 className="text-md sm:text-xl font-semibold">Explore Books</h2>
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
          640: { slidesPerView: 2, spaceBetween: 20 },
          1024: { slidesPerView: 3, spaceBetween: 30 },
          1280: { slidesPerView: 4, spaceBetween: 40 },
        }}
        className="w-full relative"
      >
        {books
          ?.filter((book, i) => books[i]?.isbn13 !== books[i - 1]?.isbn13)
          .map((book) => (
            <SwiperSlide key={book.isbn13}>
              <Link
                to={`/book/${book?.isbn13}`}
                className="group rounded-2xl shadow-md overflow-hidden relative block"
              >
                <div
                  className="absolute inset-0 bg-secondary-black transition-opacity duration-300 opacity-100 group-hover:opacity-0 z-0"
                  aria-hidden="true"
                />
                <img
                  src={book?.cover_img}
                  className="absolute inset-0 w-full h-full object-cover blur-[100px] opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-0 peer"
                  aria-hidden="true"
                  draggable={false}
                />
                <figure className="flex flex-col justify-center items-center gap-4 sm:gap-5 p-4 sm:p-6 relative z-10">
                  <div className="book-cover h-[256px] sm:h-[280px] relative">
                    <img
                      src={book?.cover_img}
                      alt={book?.title}
                      className="w-[180px] h-[280px] object-cover rounded-2xl relative transition-transform duration-300 group-hover:-translate-y-4 z-20 peer"
                    />
                  </div>
                  <figcaption className="flex flex-col justify-center items-center gap-2 sm:gap-3">
                    <h4 className="text-base sm:text-lg text-primary-white font-semibold text-center line-clamp-1">
                      {book?.title}
                    </h4>
                    <h5 className="text-sm sm:text-base text-primary-gray text-center">
                      {book?.author}
                    </h5>
                    {/* <div className="flex items-center">
                    <span className="text-yellow-400 text-sm sm:text-base">
                      {"★".repeat(Math.floor(book.rating))}
                      {book.rating % 1 !== 0 && "☆"}
                    </span>
                    <span className="text-primary-gray text-sm ml-2">
                      ({book.rating})
                    </span>
                  </div> */}
                  </figcaption>
                </figure>
              </Link>
            </SwiperSlide>
          ))}
        <div className="swiper-button-prev"></div>
        <div className="swiper-button-next"></div>
      </Swiper>
      <h2 className="text-md sm:text-xl font-semibold">Popular Books</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
        {popularBooks.map((book) => (
          <Link
            key={book?.isbn13}
            to={`/book/${book?.isbn13}`}
            className="group rounded-2xl shadow-md overflow-hidden relative block"
          >
            <div
              className="absolute inset-0 bg-secondary-black transition-opacity duration-300 opacity-100 group-hover:opacity-0 z-0"
              aria-hidden="true"
            />
            <img
              src={
                book?.cover_img ||
                `https://dhmckee.com/wp-content/uploads/2018/11/defbookcover-min.jpg`
              }
              className="absolute inset-0 w-full h-full object-cover blur-[100px] opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-0 peer"
              aria-hidden="true"
              draggable={false}
            />
            <figure className="flex flex-col justify-center items-center gap-4 sm:gap-5 p-4 sm:p-6 relative z-10">
              <div className="book-cover h-[256px] sm:h-[280px] relative">
                <img
                  src={
                    book?.cover_img ||
                    `https://dhmckee.com/wp-content/uploads/2018/11/defbookcover-min.jpg`
                  }
                  alt={book?.title}
                  className="w-[180px] h-[280px] object-cover rounded-2xl relative transition-transform duration-300 group-hover:-translate-y-4 z-20 peer"
                />
              </div>
              <figcaption className="flex flex-col justify-center items-center gap-2 sm:gap-3">
                <h4 className="text-base sm:text-lg text-primary-white font-semibold text-center line-clamp-1">
                  {book?.title}
                </h4>
                <h5 className="text-sm sm:text-base text-primary-gray text-center">
                  {book?.author}
                </h5>
              </figcaption>
            </figure>
          </Link>
        ))}
      </div>
    </div>
  );
}
