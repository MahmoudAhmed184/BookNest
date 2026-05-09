import type { ReactElement } from "react";

import { BookCard } from "../../../../components/ui";
import { routeBuilders } from "../../../../routes/paths";
import type { Book } from "../../types/book";
import { getAuthorNames } from "../../utils/bookFacets";

export interface SearchResultsGridProps {
  books: Book[];
  onRememberScroll: () => void;
}

export function SearchResultsGrid({
  books,
  onRememberScroll,
}: SearchResultsGridProps): ReactElement {
  return (
    <div id="search-results" className="bento-grid">
      {books.map((book, position) => (
        <BookCard
          key={book.id}
          book={book}
          to={routeBuilders.book(book.id)}
          title={book.title}
          author={getAuthorNames(book)}
          coverSrc={book.cover || book.cover_fallback_url}
          variant={position === 0 ? "featured" : undefined}
          className={position === 0 ? "md:col-span-2 md:row-span-2" : ""}
          onClick={onRememberScroll}
        />
      ))}
    </div>
  );
}
