import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { searchBooks } from "../services/bookService";

import { useParams } from "react-router-dom";

export default function Search() {
  const { query } = useParams();

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["books", searchTerm],
    queryFn: () => searchBooks(searchTerm),
    enabled: searchTerm.length > 0,
  });

  const books = data?.results || [];

  const handleSearchInput = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearch = () => {
    setSearchTerm(searchInput);
  };

  useEffect(() => {
    if (query) {
      setSearchInput(query);
      setSearchTerm(query); // this alone is enough
    }
  }, [query]);

  return (
    <div className="flex flex-col gap-md py-md">
      <div className="flex gap-2">
        <input
          type="text"
          className="bg-secondary-black text-primary-gray rounded-2xl outline-none px-4 py-2 placeholder-primary-gray flex-grow"
          placeholder="Search"
          onChange={handleSearchInput}
          value={searchInput}
        />
        <button
          onClick={handleSearch}
          className="btn btn-accent-v text-white px-4 py-2 rounded-2xl hover:bg-blue-600"
        >
          Search
        </button>
      </div>

      <h2 className="text-md sm:text-xl font-semibold">Search Results</h2>

      {isLoading && (
        <div className="flex-grow flex justify-center items-center">
          <div className="spinner"></div>
        </div>
      )}
      {error && <p className="text-red-500">Error fetching books</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
        {books
          // .filter((book) => book.cover_img !== null)
          .filter((book, i) => books[i]?.isbn13 !== books[i - 1]?.isbn13)
          .map((book) => (
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
