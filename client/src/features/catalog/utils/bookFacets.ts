import { colorFromString } from "../../../utils/colorFromString";
import { moodOptions, paceOptions } from "../data/moodColors";
import type { Book, Author } from "../types/book";
import type { CatalogFilters, MoodTag, PaceTag } from "../types/filters";

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

export function getBookPace(book: Book): PaceTag {
  if (book.pace === "fast" || book.pace === "medium" || book.pace === "slow") {
    return book.pace;
  }

  if (typeof book.number_of_pages === "number") {
    if (book.number_of_pages <= 260) return "fast";
    if (book.number_of_pages >= 460) return "slow";
    return "medium";
  }

  return paceOptions[colorFromString(book.title) % paceOptions.length]?.value ?? "medium";
}

export function getBookMoodTags(book: Book): MoodTag[] {
  const apiMoods = book.moods?.filter(
    (mood): mood is MoodTag =>
      mood === "adventurous" ||
      mood === "emotional" ||
      mood === "dark" ||
      mood === "funny" ||
      mood === "hopeful"
  );

  if (apiMoods?.length) return apiMoods.slice(0, 3);

  const seed = colorFromString(`${book.title} ${getAuthorNames(book)}`);
  const first = moodOptions[seed % moodOptions.length]?.value ?? "hopeful";
  const second = moodOptions[(seed + 2) % moodOptions.length]?.value ?? "emotional";
  return first === second ? [first] : [first, second];
}

export function filterBooksByCatalogFilters(
  books: Book[],
  filters: CatalogFilters
): Book[] {
  return books.filter((book) => {
    const genres = getBookGenres(book).map(normalize);
    const moods = getBookMoodTags(book);
    const pace = getBookPace(book);
    const genreMatch =
      filters.genres.length === 0 ||
      filters.genres.some((genre) => genres.includes(normalize(genre)));
    const moodMatch =
      filters.moods.length === 0 ||
      filters.moods.some((mood) => moods.includes(mood));
    const paceMatch = filters.pace.length === 0 || filters.pace.includes(pace);

    return genreMatch && moodMatch && paceMatch;
  });
}
