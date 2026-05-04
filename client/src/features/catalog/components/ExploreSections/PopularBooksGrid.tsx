import type { ReactElement } from "react";

import { BookCard } from "../../../../components/ui";
import { routeBuilders } from "../../../../routes/paths";
import { getAuthorNames } from "../../utils/bookFacets";
import type { Book } from "../../types/book";
import { SectionTitle } from "./SectionTitle";

export interface PopularBooksGridProps {
  books: Book[];
}

export function PopularBooksGrid({ books }: PopularBooksGridProps): ReactElement {
  return (
    <section className="flex flex-col gap-5" aria-labelledby="popular-books">
      <SectionTitle id="popular-books">Popular Books</SectionTitle>
      <div className="bento-grid">
        {books.map((book, position) => (
          <BookCard
            key={book.isbn13}
            to={routeBuilders.book(book.isbn13)}
            title={book.title}
            author={getAuthorNames(book)}
            coverSrc={book.cover_img}
            variant={position === 0 ? "featured" : "trending"}
            className={position === 0 ? "md:col-span-2 md:row-span-2" : ""}
          />
        ))}
      </div>
    </section>
  );
}
