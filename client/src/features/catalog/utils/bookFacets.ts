import type { Book, Author } from "../types/book";
import type { CatalogFilters } from "../types/filters";

function isAuthor(value: string | Author): value is Author {
  return typeof value !== "string";
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function getAuthorNames(book: Book): string {
  if (book.author) return book.author;
  if (!book.authors?.length) return "";

  return book.authors
    .map((author) => (isAuthor(author) ? author.name : author))
    .filter(Boolean)
    .join(", ");
}

export function getBookGenres(book: Book): string[] {
  return book.genres?.filter(Boolean) ?? [];
}

export function filterBooksByCatalogFilters(
  books: Book[],
  filters: CatalogFilters
): Book[] {
  return books.filter((book) => {
    const genres = getBookGenres(book).map(normalize);
    const authors = getAuthorNames(book).toLowerCase();
    const averageRating =
      typeof book.average_rate === "string"
        ? Number.parseFloat(book.average_rate)
        : book.average_rate;
    const pageCount = book.number_of_pages ?? 0;
    const genreMatch =
      !filters.genre || genres.includes(normalize(filters.genre));
    const authorMatch =
      !filters.author || authors.includes(normalize(filters.author));
    const ratingMatch =
      !filters.min_rating ||
      (typeof averageRating === "number" &&
        Number.isFinite(averageRating) &&
        averageRating >= Number(filters.min_rating));
    const minPagesMatch =
      !filters.num_pages_min || pageCount >= Number(filters.num_pages_min);
    const maxPagesMatch =
      !filters.num_pages_max || pageCount <= Number(filters.num_pages_max);
    const publicationDate = book.publication_date ?? "";
    const dateFromMatch =
      !filters.pub_date_from || publicationDate >= filters.pub_date_from;
    const dateToMatch = !filters.pub_date_to || publicationDate <= filters.pub_date_to;

    return (
      genreMatch &&
      authorMatch &&
      ratingMatch &&
      minPagesMatch &&
      maxPagesMatch &&
      dateFromMatch &&
      dateToMatch
    );
  });
}
