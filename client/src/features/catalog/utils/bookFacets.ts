import type { Book, Author } from "../types/book";
import type { CatalogFilters } from "../types/filters";

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function getAuthorNames(book: Book): string {
  if (book.author_names) return book.author_names;
  if (!book.authors?.length) return "";

  return book.authors
    .map((author: Author) => author.name)
    .filter(Boolean)
    .join(", ");
}

export function getBookGenres(book: Book): string[] {
  if (book.genre_labels) {
    return book.genre_labels
      .split(",")
      .map((genre) => genre.trim())
      .filter(Boolean);
  }

  return book.genres?.map((genre) => genre.name).filter(Boolean) ?? [];
}

export function filterBooksByCatalogFilters(
  books: Book[],
  filters: CatalogFilters
): Book[] {
  return books.filter((book) => {
    const genres = getBookGenres(book).map(normalize);
    const authors = getAuthorNames(book).toLowerCase();
    const averageRating =
      typeof book.average_rating === "string"
        ? Number.parseFloat(book.average_rating)
        : book.average_rating;
    const pageCount = book.page_count ?? 0;
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
