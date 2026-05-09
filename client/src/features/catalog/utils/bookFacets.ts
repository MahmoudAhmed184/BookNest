import type { Book, Author } from "../types/book";

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
