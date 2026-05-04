import { useQuery } from "@tanstack/react-query";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, A11y, Autoplay } from "swiper/modules";
import { Link } from "react-router-dom";
import { getBooks, getRecommendedBooks } from "../../services/bookService";
import BookCard from "../../components/BookCard";
import BookCardSkeleton from "../../components/BookCardSkeleton";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";

export default function Explore() {
  const {
    data: booksData,
    isLoading: isBooksLoading,
    isFetching: isBooksFetching,
    isError: isBooksError,
    refetch: refetchBooks,
  } = useQuery({
    queryKey: ["books", "python"],
    queryFn: () => getBooks("python"),
  });

  const {
    data: recommendationsData,
    isLoading: isRecommendationsLoading,
    isFetching: isRecommendationsFetching,
    isError: isRecommendationsError,
    refetch: refetchRecommendations,
  } = useQuery({
    queryKey: ["recommendations"],
    queryFn: getRecommendedBooks,
  });

  const books = booksData?.results || [];
  const recommendations = recommendationsData || [];

  const popularBooks: Array<{
    title: string;
    authors: string[];
    author?: string;
    language: string;
    date: string;
    isbn13: string;
    cover_img: string;
  }> = [
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

  const uniqueBooks = books.filter(
    (book, index) => books[index]?.isbn13 !== books[index - 1]?.isbn13
  );

  const sectionHeadingClass =
    "text-xl sm:text-2xl font-semibold text-primary-white text-balance";

  const skeletonRow = (
    <div
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
      role="status"
      aria-live="polite"
    >
      {Array.from({ length: 4 }).map((_, index) => (
        <BookCardSkeleton key={index} />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-12 py-12 animate-fade-up">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold text-primary-white text-balance">
          Explore
        </h1>
        <p className="max-w-2xl text-sm text-primary-gray leading-relaxed">
          Browse new paths into BookNest, from popular genres to books readers
          are discovering right now.
        </p>
      </header>

      <section className="flex flex-col gap-5" aria-labelledby="popular-genres">
        <h2 id="popular-genres" className={sectionHeadingClass}>
          Popular Genres
        </h2>
        <Swiper
          modules={[Navigation, A11y, Autoplay]}
          spaceBetween={16}
          slidesPerView={1}
          navigation={{
            prevEl: ".explore-genres-prev",
            nextEl: ".explore-genres-next",
          }}
          autoplay={{ delay: 3000, disableOnInteraction: false }}
          breakpoints={{
            640: { slidesPerView: 2, spaceBetween: 16 },
            1024: { slidesPerView: 3, spaceBetween: 20 },
            1280: { slidesPerView: 4, spaceBetween: 24 },
          }}
          className="w-full relative"
        >
          {categories.map((category) => (
            <SwiperSlide key={category.id}>
              <Link
                to={`/search/${category.title}`}
                title={`Browse ${category.title} books`}
                className="flex min-h-[56px] items-center justify-center rounded-full bg-secondary-black px-4 py-2 text-center text-base font-medium text-primary-white shadow-md transition-all duration-200 ease-out hover:-translate-y-1 hover:bg-secondary-gray hover:shadow-lg focus-visible:outline-accent"
              >
                {category.title}
              </Link>
            </SwiperSlide>
          ))}
          <div className="swiper-button-prev explore-genres-prev"></div>
          <div className="swiper-button-next explore-genres-next"></div>
        </Swiper>
      </section>

      <section className="flex flex-col gap-5" aria-labelledby="recommended-books">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="recommended-books" className={sectionHeadingClass}>
            Recommended For You
          </h2>
          {isRecommendationsFetching && recommendations.length > 0 ? (
            <p className="text-xs text-primary-gray" role="status">
              Updating recommendations...
            </p>
          ) : null}
        </div>
        {isRecommendationsLoading ? skeletonRow : null}
        {isRecommendationsError ? (
          <ErrorState
            title="Recommendations are unavailable"
            message="We could not load your recommendations right now."
            onRetry={() => void refetchRecommendations()}
            isRetrying={isRecommendationsFetching}
          />
        ) : null}
        {!isRecommendationsLoading &&
        !isRecommendationsError &&
        recommendations.length === 0 ? (
          <EmptyState
            title="Recommendations are warming up"
            description="Rate more books to unlock personalized recommendations that match your reading taste."
            actionLabel="Browse books"
            actionTo="/search"
          />
        ) : null}
        {!isRecommendationsLoading &&
        !isRecommendationsError &&
        recommendations.length > 0 ? (
          <Swiper
            modules={[Navigation, Pagination, A11y, Autoplay]}
            spaceBetween={20}
            slidesPerView={1}
            navigation={{
              prevEl: ".explore-recommendations-prev",
              nextEl: ".explore-recommendations-next",
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
            {recommendations.map((book) => (
              <SwiperSlide key={book.book}>
                <BookCard
                  to={`/book/${book.book}`}
                  title={book.book_title}
                  coverSrc={book.book_cover}
                  showAuthor={false}
                />
              </SwiperSlide>
            ))}
            <div className="swiper-button-prev explore-recommendations-prev"></div>
            <div className="swiper-button-next explore-recommendations-next"></div>
          </Swiper>
        ) : null}
      </section>

      <section className="flex flex-col gap-5" aria-labelledby="explore-books">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="explore-books" className={sectionHeadingClass}>
            Explore Books
          </h2>
          {isBooksFetching && uniqueBooks.length > 0 ? (
            <p className="text-xs text-primary-gray" role="status">
              Updating books...
            </p>
          ) : null}
        </div>
        {isBooksLoading ? skeletonRow : null}
        {isBooksError ? (
          <ErrorState
            title="Books could not be loaded"
            message="We could not load this book shelf. Please try again."
            onRetry={() => void refetchBooks()}
            isRetrying={isBooksFetching}
          />
        ) : null}
        {!isBooksLoading && !isBooksError && uniqueBooks.length === 0 ? (
          <EmptyState
            title="No books found yet"
            description="Try searching for a genre, author, or title to keep exploring."
            actionLabel="Search books"
            actionTo="/search"
          />
        ) : null}
        {!isBooksLoading && !isBooksError && uniqueBooks.length > 0 ? (
          <Swiper
            modules={[Navigation, Pagination, A11y, Autoplay]}
            spaceBetween={20}
            slidesPerView={1}
            navigation={{
              prevEl: ".explore-books-prev",
              nextEl: ".explore-books-next",
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
            {uniqueBooks.map((book) => (
              <SwiperSlide key={book.isbn13}>
                <BookCard
                  to={`/book/${book.isbn13}`}
                  title={book.title}
                  author={book.author}
                  coverSrc={book.cover_img}
                />
              </SwiperSlide>
            ))}
            <div className="swiper-button-prev explore-books-prev"></div>
            <div className="swiper-button-next explore-books-next"></div>
          </Swiper>
        ) : null}
      </section>

      <section className="flex flex-col gap-5" aria-labelledby="popular-books">
        <h2 id="popular-books" className={sectionHeadingClass}>
          Popular Books
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {popularBooks.map((book) => (
            <BookCard
              key={book.isbn13}
              to={`/book/${book.isbn13}`}
              title={book.title}
              author={book.authors.join(", ")}
              coverSrc={book.cover_img}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
