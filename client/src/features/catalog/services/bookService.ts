import {
  authHeaders,
  deleteData,
  getData,
  patchData,
  postData,
  throwApiError,
} from "../../../lib/axios";
import axios from "axios";
import { normalizeEmptyResponse } from "../../../lib/normalizers";
import type {
  Book,
  BookRating,
  BookReview,
  BookSearchResponse,
  Author,
  CatalogGenre,
  CreateRatingPayload,
  CreateReviewPayload,
  DeleteBookPayload,
  FeedActivity,
  GenreSearchResponse,
  RecommendedBook,
} from "../types/book";

export async function getBooks(
  query: string
): Promise<BookSearchResponse> {
  const params = new URLSearchParams({
    q: query,
    page_size: "50",
  });

  try {
    const response = await getData<BookSearchResponse>(
      `/api/v1/books/search-results/?${params.toString()}`
    );

    return response;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getPopularBooks(limit = 12): Promise<Book[]> {
  try {
    const response = await getData<BookSearchResponse>(
      `/api/v1/books/?limit=${limit}`
    );
    return response.results || [];
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getGenres(limit = 50): Promise<CatalogGenre[]> {
  try {
    const response = await getData<GenreSearchResponse>(
      `/api/v1/genres/?limit=${limit}`
    );
    return response.results || [];
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getBook(id: string | undefined): Promise<Book> {
  try {
    const response = await getData<Book>(`/api/v1/books/${id}/`);
    return response;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getAuthor(id: string | undefined): Promise<Author> {
  try {
    const response = await getData<Author>(`/api/v1/authors/${id}/`);
    return response;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getAuthorBooks(id: string | undefined): Promise<Book[]> {
  try {
    const response = await getData<BookSearchResponse>(
      `/api/v1/authors/${id}/books/?limit=24`
    );
    return response.results || [];
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getRelatedBooks(id: string | undefined): Promise<Book[]> {
  try {
    const response = await getData<Book[]>(
      `/api/v1/books/${id}/related-books/?limit=8`
    );
    return response;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getFeedActivities(limit = 20): Promise<FeedActivity[]> {
  try {
    const response = await getData<FeedActivity[]>(
      `/api/v1/feed-activities/?limit=${limit}`
    );
    return response;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function searchBooks(
  query: string
): Promise<BookSearchResponse> {
  const params = new URLSearchParams({
    q: query,
    page_size: "24",
  });

  try {
    const response = await getData<BookSearchResponse>(
      `/api/v1/books/search-results/?${params.toString()}`
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
      `/api/v1/books/${id}/reviews/`
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
      "/api/v1/reviews/",
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
      "/api/v1/ratings/",
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

export async function getRatingForBook(
  id: string | undefined,
  token?: string | null
): Promise<BookRating | null> {
  try {
    const response = await getData<BookRating>(
      `/api/v1/books/${id}/ratings/me/`,
      {
        headers: authHeaders(token),
      }
    );
    return response;
  } catch (error: unknown) {
    if (
      axios.isAxiosError(error) &&
      (error.response?.status === 400 || error.response?.status === 404)
    ) {
      return null;
    }

    throwApiError(error);
  }
}

export async function updateRating(
  rateId: string | number,
  rate: number,
  token?: string | null
): Promise<BookRating> {
  try {
    const response = await patchData<BookRating, { rate: number }>(
      `/api/v1/ratings/${rateId}/`,
      { rate },
      {
        headers: authHeaders(token),
      }
    );
    return response;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function deleteRating(
  rateId: string | number,
  token?: string | null
): Promise<void> {
  try {
    await deleteData<void>(`/api/v1/ratings/${rateId}/`, {
      headers: authHeaders(token),
    });
    return normalizeEmptyResponse();
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function deleteBook(
  data: DeleteBookPayload,
  token?: string | null
): Promise<void> {
  if (!token) {
    throw new Error("Authentication token is missing");
  }

  try {
    await deleteData<void, DeleteBookPayload>(
      `/api/v1/reading-lists/${data.list_id}/books/${data.book_id}/`,
      {
        headers: authHeaders(token),
        data,
      }
    );
    return normalizeEmptyResponse();
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getRecommendedBooks(
  token?: string | null
): Promise<RecommendedBook[]> {
  try {
    const response = await getData<RecommendedBook[]>(
      "/api/v1/recommendations/",
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
      `/api/v1/books/${id}/ratings/`,
      {
        headers: authHeaders(token),
      }
    );
    return response;
  } catch (error: unknown) {
    throwApiError(error);
  }
}
