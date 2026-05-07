import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createQueryWrapper } from "../../../test/renderHookWithClient";
import {
  createRating,
  createReview,
  getBook,
  getBookRatings,
  getBooks,
  getGenres,
  getPopularBooks,
  getRecommendedBooks,
  getReviews,
} from "../services/bookService";
import {
  addToCollection,
  getCollections,
} from "../../collections/services/collectionService";
import { useBookActions } from "./useBookActions";
import { useBookPageData } from "./useBookPageData";
import { useExploreCatalog } from "./useExploreCatalog";
import { useSearchBooks } from "./useSearchBooks";

vi.mock("../services/bookService", () => ({
  createRating: vi.fn(),
  createReview: vi.fn(),
  getBook: vi.fn(),
  getBookRatings: vi.fn(),
  getBooks: vi.fn(),
  getGenres: vi.fn(),
  getPopularBooks: vi.fn(),
  getRecommendedBooks: vi.fn(),
  getReviews: vi.fn(),
  searchBooks: vi.fn(),
}));

vi.mock("../../collections/services/collectionService", () => ({
  addToCollection: vi.fn(),
  getCollections: vi.fn(),
}));

describe("catalog hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads explore books and recommendations", async () => {
    vi.mocked(getRecommendedBooks).mockResolvedValue([
      { book: "1", book_title: "Python 101" },
    ]);
    vi.mocked(getGenres).mockResolvedValue([{ id: 1, name: "Fiction" }]);
    vi.mocked(getPopularBooks).mockResolvedValue([
      { isbn13: "1", title: "Python 101" },
    ]);

    const { result } = renderHook(() => useExploreCatalog("token"), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isBooksLoading).toBe(false));
    expect(result.current.books[0]?.title).toBe("Python 101");
    expect(getBooks).not.toHaveBeenCalled();
    expect(getPopularBooks).toHaveBeenCalledWith(24);
    expect(result.current.recommendations[0]?.book_title).toBe("Python 101");
  });

  it("loads search results", async () => {
    const { searchBooks } = await import("../services/bookService");
    vi.mocked(searchBooks).mockResolvedValue({
      results: [{ isbn13: "2", title: "Search Result" }],
    });

    const { result } = renderHook(() => useSearchBooks("fiction"), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.books[0]?.title).toBe("Search Result");
  });

  it("loads book page data", async () => {
    vi.mocked(getCollections).mockResolvedValue([{ list_id: 1, name: "Shelf" }]);
    vi.mocked(getBook).mockResolvedValue({ isbn13: "1", title: "Book" });
    vi.mocked(getReviews).mockResolvedValue([
      { review_id: 1, review_text: "Good" },
    ]);
    vi.mocked(getBookRatings).mockResolvedValue([{ rate_id: 1, rate: 4 }]);

    const { result } = renderHook(() => useBookPageData("1"), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isBookLoading).toBe(false));
    expect(result.current.book?.title).toBe("Book");
    expect(result.current.reviews?.[0]?.review_text).toBe("Good");
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
    vi.mocked(createReview).mockResolvedValue({
      review_id: 1,
      review_text: "Great",
    });
    vi.mocked(createRating).mockResolvedValue({ rate_id: 1, rate: 5 });

    const { result } = renderHook(
      () =>
        useBookActions({
          id: "9780000000001",
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
        { book: "9780000000001", review_text: "Great" },
        "token"
      );
      expect(createRating).toHaveBeenCalledWith(
        { book: "9780000000001", rate: 5 },
        "token"
      );
    });
    await waitFor(() => expect(onReviewSubmitted).toHaveBeenCalled());
  });

  it("uses separate reading lists for library and completed actions", async () => {
    vi.mocked(addToCollection).mockResolvedValue({ message: "Book added." });

    const { result } = renderHook(
      () =>
        useBookActions({
          id: "9780000000001",
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
        { book_id: "9780000000001", list_id: 1 },
        "token"
      );
      expect(addToCollection).toHaveBeenCalledWith(
        { book_id: "9780000000001", list_id: 3 },
        "token"
      );
    });
  });

  it("can save a rating without creating a review", async () => {
    vi.mocked(createRating).mockResolvedValue({ rate_id: 1, rate: 4 });

    const { result } = renderHook(
      () =>
        useBookActions({
          id: "9780000000001",
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
        { book: "9780000000001", rate: 4 },
        "token"
      );
    });
    expect(createReview).not.toHaveBeenCalled();
  });
});
