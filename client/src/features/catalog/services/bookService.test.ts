import { beforeEach, describe, expect, it, vi } from "vitest";

import { getData } from "../../../lib/axios";
import type { LimitOffsetApiResponse } from "../../../types/api";
import type { Book, RelatedBook } from "../types/book";
import { getRelatedBooks } from "./bookService";

vi.mock("../../../lib/axios", () => ({
  authHeaders: vi.fn(() => ({})),
  deleteData: vi.fn(),
  getData: vi.fn(),
  patchData: vi.fn(),
  postData: vi.fn(),
  throwApiError: vi.fn((error: unknown): never => {
    throw error instanceof Error ? error : new Error(String(error));
  }),
  throwApiRequestError: vi.fn((error: unknown): never => {
    throw error instanceof Error ? error : new Error(String(error));
  }),
}));

function book(id: number, title: string): Book {
  return { id, title };
}

function page<T>(results: T[]): LimitOffsetApiResponse<T> {
  return {
    count: results.length,
    next: null,
    previous: null,
    results,
  };
}

describe("bookService related books", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes explicit related-book rows into book cards", async () => {
    const relatedBook: RelatedBook = {
      id: 10,
      from_book: 1,
      to_book: book(2, "Explicit Related"),
      relation_type: "similar",
      score: 1,
    };
    vi.mocked(getData).mockResolvedValueOnce(page([relatedBook]));

    await expect(getRelatedBooks("1")).resolves.toEqual([
      book(2, "Explicit Related"),
    ]);
    expect(getData).toHaveBeenCalledTimes(1);
    expect(getData).toHaveBeenCalledWith(
      "/api/v1/books/1/related-books/?page_size=12"
    );
  });

  it("falls back to live related-book suggestions when explicit rows are empty", async () => {
    vi.mocked(getData)
      .mockResolvedValueOnce(page<RelatedBook>([]))
      .mockResolvedValueOnce({
        count: 1,
        suggestions: [book(3, "Fallback Related")],
      });

    await expect(getRelatedBooks("1")).resolves.toEqual([
      book(3, "Fallback Related"),
    ]);
    expect(getData).toHaveBeenNthCalledWith(
      1,
      "/api/v1/books/1/related-books/?page_size=12"
    );
    expect(getData).toHaveBeenNthCalledWith(
      2,
      "/api/v1/search/related-books/?book_id=1&limit=12"
    );
  });
});
