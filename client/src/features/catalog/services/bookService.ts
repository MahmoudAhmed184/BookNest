import {
  authHeaders,
  deleteData,
  getData,
  postData,
  throwApiError,
} from "../../../lib/axios";
import type { ApiDetailResponse } from "../../../types/api";
import type {
  Book,
  BookRating,
  BookReview,
  BookSearchResponse,
  CreateRatingPayload,
  CreateReviewPayload,
  DeleteBookPayload,
  RecommendedBook,
} from "../types/book";

export async function getBooks(
  query: string
): Promise<BookSearchResponse> {
  try {
    const response = await getData<BookSearchResponse>(
      `/api/books/search/?q=${query}&page_size=50`
    );

    return response;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getBook(id: string | undefined): Promise<Book> {
  try {
    const response = await getData<Book>(`/api/books/books/${id}/`);
    return response;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function searchBooks(
  query: string
): Promise<BookSearchResponse> {
  try {
    const response = await getData<BookSearchResponse>(
      `/api/books/search/?q=${query}&page_size=100`
    );
    return response;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getReviews(
  id: string | undefined
): Promise<BookReview[]> {
  try {
    const response = await getData<BookReview[]>(
      `/api/books/books/${id}/reviews/`
    );
    return response;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function createReview(
  data: CreateReviewPayload,
  token?: string | null
): Promise<BookReview> {
  try {
    const response = await postData<BookReview, CreateReviewPayload>(
      "/api/books/review/create/",
      data,
      {
        headers: authHeaders(token),
      }
    );
    return response;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function createRating(
  data: CreateRatingPayload,
  token?: string | null
): Promise<BookRating> {
  try {
    const response = await postData<BookRating, CreateRatingPayload>(
      "/api/books/rating/create/",
      data,
      {
        headers: authHeaders(token),
      }
    );
    return response;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function deleteBook(
  data: DeleteBookPayload,
  token?: string | null
): Promise<ApiDetailResponse> {
  if (!token) {
    throw new Error("Authentication token is missing");
  }

  try {
    const response = await deleteData<ApiDetailResponse, DeleteBookPayload>(
      "/api/books/reading-lists/books/",
      {
        headers: authHeaders(token),
        data,
      }
    );
    return response;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getRecommendedBooks(
  token?: string | null
): Promise<RecommendedBook[]> {
  try {
    const response = await getData<RecommendedBook[]>(
      "/api/recommendation/user-recommendations/",
      {
        headers: authHeaders(token),
      }
    );

    return response;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getBookRatings(
  id: string | undefined,
  token?: string | null
): Promise<BookRating[]> {
  try {
    const response = await getData<BookRating[]>(
      `/api/books/books/${id}/ratings/`,
      {
        headers: authHeaders(token),
      }
    );
    return response;
  } catch (error: unknown) {
    throwApiError(error);
  }
}
