import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createQueryWrapper } from "../../../test/renderHookWithClient";
import {
  createRating,
  createReview,
  getBook,
  getBookRatings,
  getBooks,
  getCatalogBooks,
  getGenres,
  getPopularBooks,
  getRecommendedBooks,
  getReviews,
  getSuggestions,
} from "../services/bookService";
import {
  addToCollection,
  getCollections,
} from "../../collections/services/collectionService";
import { useBookActions } from "./useBookActions";
import { useBookPageData } from "./useBookPageData";
import { useBookSuggestions } from "./useBookSuggestions";
import { useExploreCatalog } from "./useExploreCatalog";
import { useSearchBooks } from "./useSearchBooks";
import type { OffsetPaginatedResponse } from "../../../types/api";
import type { Book, BookRating, BookReview, SearchAutocompleteTerm } from "../types/book";
import type { CollectionBook, ReadingCollection, ReadingProgress } from "../../collections/types/collection";

vi.mock("../services/bookService", () => ({
  createRating: vi.fn(),
  createRecommendationFeedback: vi.fn(),
  createReview: vi.fn(),
  clickRecommendation: vi.fn(),
  deleteRating: vi.fn(),
  deleteReviewVote: vi.fn(),
  dismissRecommendation: vi.fn(),
  getBook: vi.fn(),
  getBookRatings: vi.fn(),
  getBooks: vi.fn(),
  getCatalogBooks: vi.fn(),
  getGenres: vi.fn(),
  getPopularBooks: vi.fn(),
  getRecommendedBooks: vi.fn(),
  getReviews: vi.fn(),
  getSuggestions: vi.fn(),
  listReviewVotes: vi.fn(),
  searchBooks: vi.fn(),
  updateRating: vi.fn(),
  updateReview: vi.fn(),
  voteOnReview: vi.fn(),
}));

vi.mock("../../collections/services/collectionService", () => ({
  addToCollection: vi.fn(),
  getCollections: vi.fn(),
  saveReadingProgress: vi.fn(),
}));

function book(id: number, title: string): Book {
  return { id, title };
}

function suggestion(id: number, title: string): SearchAutocompleteTerm {
  return {
    id,
    term: title,
    normalized_term: title.toLowerCase(),
    term_type: "book",
    weight: 1,
    use_count: 1,
    target_object_id: id,
  };
}

function collection(id: number, name: string): ReadingCollection {
  return {
    id,
    owner: 1,
    name,
    list_type: "custom",
    privacy: "private",
  };
}

function review(id: number, body: string): BookReview {
  return { id, user: 1, book: 1, body };
}

function rating(id: number, value: number): BookRating {
  return { id, user: 1, book: 1, value };
}

function collectionBook(id: number, collectionId = 1): CollectionBook {
  return {
    id,
    collection: collectionId,
    book: 1,
    status: "todo",
    position: 1,
  };
}

function progress(id: number): ReadingProgress {
  return {
    id,
    user: 1,
    book: 1,
    status: "done",
    current_page: 0,
    percent_complete: 100,
  };
}

function offsetPagination<T>(
  results: T[],
  page = 1,
  pageSize = 24
): OffsetPaginatedResponse<T> {
  return {
    count: results.length,
    next: null,
    previous: null,
    results,
    page,
    pageSize,
    totalPages: results.length > 0 ? 1 : 0,
    hasNext: false,
    hasPrevious: page > 1,
  };
}

describe("catalog hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads explore books and categories", async () => {
    vi.mocked(getGenres).mockResolvedValue([{ id: 1, name: "Fiction" }]);
    vi.mocked(getCatalogBooks).mockResolvedValue(
      offsetPagination([book(1, "Python 101")])
    );

    const { result } = renderHook(() => useExploreCatalog(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isBooksLoading).toBe(false));
    expect(result.current.books[0]?.title).toBe("Python 101");
    expect(getBooks).not.toHaveBeenCalled();
    expect(getCatalogBooks).toHaveBeenCalledWith({ page: 1, pageSize: 24 });
    expect(getPopularBooks).not.toHaveBeenCalled();
    expect(getRecommendedBooks).not.toHaveBeenCalled();
  });

  it("loads search results", async () => {
    const { searchBooks } = await import("../services/bookService");
    vi.mocked(searchBooks).mockResolvedValue(
      offsetPagination([book(2, "Search Result")])
    );

    const { result } = renderHook(() => useSearchBooks("fiction"), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.books[0]?.title).toBe("Search Result");
  });

  it("loads typeahead suggestions", async () => {
    vi.mocked(getSuggestions).mockResolvedValue([
      suggestion(3, "Suggested Book"),
    ]);

    const { result } = renderHook(() => useBookSuggestions("suggest", 5), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(getSuggestions).toHaveBeenCalledWith("suggest", 5);
    expect(result.current.suggestions[0]?.term).toBe("Suggested Book");
  });

  it("loads book page data", async () => {
    vi.mocked(getCollections).mockResolvedValue([collection(1, "Shelf")]);
    vi.mocked(getBook).mockResolvedValue(book(1, "Book"));
    vi.mocked(getReviews).mockResolvedValue([
      review(1, "Good"),
    ]);
    vi.mocked(getBookRatings).mockResolvedValue([rating(1, 4)]);

    const { result } = renderHook(() => useBookPageData("1"), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isBookLoading).toBe(false));
    expect(result.current.book?.title).toBe("Book");
    expect(result.current.reviews?.[0]?.body).toBe("Good");
  });

  it("exposes book actions", () => {
    const { result } = renderHook(
      () =>
        useBookActions({
          id: "1",
          completedListId: 3,
          rating: 5,
          reviewText: "Great",
          onRatingDeleted: vi.fn(),
          onReviewSubmitted: vi.fn(),
        }),
      { wrapper: createQueryWrapper() }
    );

    expect(typeof result.current.addBookToList).toBe("function");
    expect(typeof result.current.markAsRead).toBe("function");
    expect(typeof result.current.submitRating).toBe("function");
    expect(typeof result.current.submitReview).toBe("function");
  });

  it("submits reviews and ratings without a client-supplied user id", async () => {
    const onReviewSubmitted = vi.fn();
    vi.mocked(createReview).mockResolvedValue(review(1, "Great"));
    vi.mocked(createRating).mockResolvedValue(rating(1, 5));

    const { result } = renderHook(
      () =>
        useBookActions({
          id: "1",
          completedListId: 3,
          rating: 5,
          reviewText: "Great",
          token: "token",
          onRatingDeleted: vi.fn(),
          onReviewSubmitted,
        }),
      { wrapper: createQueryWrapper() }
    );

    act(() => {
      result.current.submitReview();
    });

    await waitFor(() => {
      expect(createReview).toHaveBeenCalledWith(
        { book: 1, rating: 1, body: "Great" },
        "token"
      );
      expect(createRating).toHaveBeenCalledWith(
        { book: 1, value: 5 },
        "token"
      );
    });
    await waitFor(() => expect(onReviewSubmitted).toHaveBeenCalled());
  });

  it("uses separate collections for library and completed actions", async () => {
    vi.mocked(addToCollection).mockResolvedValue(collectionBook(1));
    const { saveReadingProgress } = await import("../../collections/services/collectionService");
    vi.mocked(saveReadingProgress).mockResolvedValue(progress(1));

    const { result } = renderHook(
      () =>
        useBookActions({
          id: "1",
          completedListId: 3,
          rating: 5,
          reviewText: "",
          token: "token",
          onRatingDeleted: vi.fn(),
          onReviewSubmitted: vi.fn(),
        }),
      { wrapper: createQueryWrapper() }
    );

    act(() => {
      result.current.addBookToList(1);
      result.current.markAsRead();
    });

    await waitFor(() => {
      expect(addToCollection).toHaveBeenCalledWith(
        { book: 1, collection: 1 },
        "token"
      );
      expect(addToCollection).toHaveBeenCalledWith(
        { book: 1, collection: 3, status: "done" },
        "token"
      );
    });
  });

  it("can save a rating without creating a review", async () => {
    vi.mocked(createRating).mockResolvedValue(rating(1, 4));

    const { result } = renderHook(
      () =>
        useBookActions({
          id: "1",
          completedListId: 3,
          rating: 4,
          reviewText: "",
          token: "token",
          onRatingDeleted: vi.fn(),
          onReviewSubmitted: vi.fn(),
        }),
      { wrapper: createQueryWrapper() }
    );

    act(() => {
      result.current.submitRating();
    });

    await waitFor(() => {
      expect(createRating).toHaveBeenCalledWith(
        { book: 1, value: 4 },
        "token"
      );
    });
    expect(createReview).not.toHaveBeenCalled();
  });
});
