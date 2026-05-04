import {
  authHeaders,
  deleteData,
  getApiError,
  getData,
  postData,
  throwApiError,
} from "./apiClient";
import type { ApiDetailResponse } from "../types/api";
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
    console.log(response);

    return response;
  } catch (error: unknown) {
    const apiError = getApiError(error);
    console.log(apiError);
    throwApiError(error);
  }
}

export async function getBook(id: string | undefined): Promise<Book> {
  try {
    const response = await getData<Book>(`/api/books/books/${id}/`);
    console.log(response);
    return response;
  } catch (error: unknown) {
    const apiError = getApiError(error);
    console.log(apiError);
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
    console.log(response);
    return response;
  } catch (error: unknown) {
    const apiError = getApiError(error);
    console.log(apiError);
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
    console.log(response);
    return response;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function createReview(
  data: CreateReviewPayload
): Promise<BookReview> {
  try {
    const response = await postData<BookReview, CreateReviewPayload>(
      "/api/books/review/create/",
      data,
      {
        headers: authHeaders(),
      }
    );
    console.log(response);
    return response;
  } catch (error: unknown) {
    const apiError = getApiError(error);
    console.log(apiError);
    throwApiError(error);
  }
}

export async function createRating(
  data: CreateRatingPayload
): Promise<BookRating> {
  try {
    const response = await postData<BookRating, CreateRatingPayload>(
      "/api/books/rating/create/",
      data,
      {
        headers: authHeaders(),
      }
    );
    console.log(response);
    return response;
  } catch (error: unknown) {
    const apiError = getApiError(error);
    console.log(apiError);
    throwApiError(error);
  }
}

export async function deleteBook(
  data: DeleteBookPayload
): Promise<ApiDetailResponse> {
  console.log("Data sent:", data);

  const token = localStorage.getItem("token");
  if (!token) {
    console.error("No token found in localStorage");
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
    console.log("Response:", response);
    return response;
  } catch (error: unknown) {
    console.error("Error response:", getApiError(error));
    throwApiError(error);
  }
}

export async function getRecommendedBooks(): Promise<RecommendedBook[]> {
  try {
    const response = await getData<RecommendedBook[]>(
      "/api/recommendation/user-recommendations/",
      {
        headers: authHeaders(),
      }
    );
    console.log(response);

    return response;
  } catch (error: unknown) {
    const apiError = getApiError(error);
    console.log(apiError);
    throwApiError(error);
  }
}

export async function getBookRatings(
  id: string | undefined
): Promise<BookRating[]> {
  try {
    const response = await getData<BookRating[]>(
      `/api/books/books/${id}/ratings/`,
      {
        headers: authHeaders(),
      }
    );
    console.log(response);
    return response;
  } catch (error: unknown) {
    const apiError = getApiError(error);
    console.log(apiError);
    throwApiError(error);
  }
}
