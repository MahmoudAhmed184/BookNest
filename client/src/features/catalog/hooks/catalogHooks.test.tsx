import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createQueryWrapper } from "../../../test/renderHookWithClient";
import {
  getBook,
  getBookRatings,
  getBooks,
  getGenres,
  getPopularBooks,
  getRecommendedBooks,
  getReviews,
} from "../services/bookService";
import { getCollections } from "../../collections/services/collectionService";
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
  it("loads explore books and recommendations", async () => {
    vi.mocked(getBooks).mockResolvedValue({
      results: [{ isbn13: "1", title: "Python 101" }],
    });
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
          listId: 1,
          rating: 5,
          reviewText: "Great",
          onReviewSubmitted: vi.fn(),
        }),
      { wrapper: createQueryWrapper() }
    );

    expect(typeof result.current.addBook).toBe("function");
    expect(typeof result.current.submitReview).toBe("function");
  });
});
