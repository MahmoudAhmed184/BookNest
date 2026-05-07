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
  CursorPageParams,
  LimitOffsetApiResponse,
  OffsetPageParams,
  OffsetPaginatedResponse,
  PageNumberApiResponse,
} from "../../../types/api";
import type {
  Book,
  BookRating,
  BookReview,
  BookSearchResponse,
  BookSuggestionsResponse,
  Author,
  CatalogGenre,
  CreateRatingPayload,
  CreateReviewPayload,
  DeleteBookPayload,
  FeedActivityResponse,
  GenreSearchResponse,
  RecommendedBook,
  ReviewSortParams,
} from "../types/book";

export interface SearchBooksParams extends OffsetPageParams {
  query: string;
}

export interface CatalogBookFilters {
  author?: string | undefined;
  genre?: string | undefined;
  min_rating?: number | undefined;
  pub_date_from?: string | undefined;
  pub_date_to?: string | undefined;
  num_pages_min?: number | undefined;
  num_pages_max?: number | undefined;
}

export interface CatalogBooksParams
  extends OffsetPageParams,
    CatalogBookFilters {}

type SearchBooksInput = string | SearchBooksParams;

const defaultSearchPageParams: OffsetPageParams = {
  page: 1,
  pageSize: 24,
};

function buildLimitOffsetParams(params: OffsetPageParams): URLSearchParams {
  return new URLSearchParams({
    limit: String(params.pageSize),
    offset: String((params.page - 1) * params.pageSize),
  });
}

function appendCatalogFilters(
  searchParams: URLSearchParams,
  filters: CatalogBookFilters
): void {
  if (filters.author) {
    searchParams.set("authors__name__icontains", filters.author);
  }

  if (filters.genre) {
    searchParams.set("genres__name__exact", filters.genre);
  }

  if (typeof filters.min_rating === "number") {
    searchParams.set("average_rate__gte", String(filters.min_rating));
  }

  if (filters.pub_date_from) {
    searchParams.set("publication_date__gte", filters.pub_date_from);
  }

  if (filters.pub_date_to) {
    searchParams.set("publication_date__lte", filters.pub_date_to);
  }

  if (typeof filters.num_pages_min === "number") {
    searchParams.set("number_of_pages__gte", String(filters.num_pages_min));
  }

  if (typeof filters.num_pages_max === "number") {
    searchParams.set("number_of_pages__lte", String(filters.num_pages_max));
  }
}

function normalizeLimitOffsetResponse<T>(
  response: LimitOffsetApiResponse<T>,
  params: OffsetPageParams
): OffsetPaginatedResponse<T> {
  const count = response.count ?? response.results.length;
  const totalPages = count > 0 ? Math.ceil(count / params.pageSize) : 0;
  const hasNext =
    response.next !== undefined ? response.next !== null : params.page < totalPages;
  const hasPrevious =
    response.previous !== undefined ? response.previous !== null : params.page > 1;

  return {
    count,
    next: response.next ?? null,
    previous: response.previous ?? null,
    results: response.results,
    page: params.page,
    pageSize: params.pageSize,
    totalPages,
    hasNext,
    hasPrevious,
  };
}

function normalizePageNumberResponse<T>(
  response: PageNumberApiResponse<T>,
  params: OffsetPageParams
): OffsetPaginatedResponse<T> {
  const pagination = response.pagination;
  const page = pagination?.current_page ?? params.page;
  const pageSize = pagination?.page_size ?? params.pageSize;
  const count = pagination?.total_count ?? response.results.length;
  const totalPages =
    pagination?.total_pages ?? (count > 0 ? Math.ceil(count / pageSize) : 0);
  const hasNext = pagination?.has_next ?? page < totalPages;
  const hasPrevious = pagination?.has_previous ?? page > 1;

  return {
    count,
    next: null,
    previous: null,
    results: response.results,
    page,
    pageSize,
    totalPages,
    hasNext,
    hasPrevious,
  };
}

function normalizeSearchInput(input: SearchBooksInput): SearchBooksParams {
  if (typeof input === "string") {
    return {
      query: input,
      ...defaultSearchPageParams,
    };
  }

  return input;
}

function buildFeedUrl(params: CursorPageParams): string {
  const searchParams = new URLSearchParams({
    limit: String(params.pageSize),
  });

  if (params.cursor) {
    searchParams.set("cursor", params.cursor);
  }

  return `/api/v1/feed-activities/?${searchParams.toString()}`;
}

export async function getBooks(
  query: string,
  filters: CatalogBookFilters = {}
): Promise<BookSearchResponse> {
  const params = new URLSearchParams({
    q: query,
    page_size: "50",
  });
  if (filters.author) params.set("authors", filters.author);
  if (filters.genre) params.set("genres", filters.genre);
  if (typeof filters.min_rating === "number") {
    params.set("min_rating", String(filters.min_rating));
  }
  if (filters.pub_date_from) params.set("pub_date_from", filters.pub_date_from);
  if (filters.pub_date_to) params.set("pub_date_to", filters.pub_date_to);
  if (typeof filters.num_pages_min === "number") {
    params.set("num_pages", String(filters.num_pages_min));
  }
  if (typeof filters.num_pages_max === "number") {
    params.set("num_pages_max", String(filters.num_pages_max));
  }

  try {
    const response = await getData<PageNumberApiResponse<Book>>(
      `/api/v1/books/search-results/?${params.toString()}`
    );

    return normalizePageNumberResponse(response, { page: 1, pageSize: 50 });
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getSuggestions(
  query: string,
  limit = 5
): Promise<Book[]> {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
  });

  try {
    const response = await getData<BookSuggestionsResponse>(
      `/api/v1/books/suggestions/?${params.toString()}`
    );
    return response.suggestions;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getCatalogBooks(
  params: CatalogBooksParams
): Promise<BookSearchResponse> {
  const searchParams = buildLimitOffsetParams(params);
  appendCatalogFilters(searchParams, params);

  try {
    const response = await getData<LimitOffsetApiResponse<Book>>(
      `/api/v1/books/?${searchParams.toString()}`
    );
    return normalizeLimitOffsetResponse(response, params);
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getPopularBooks(limit = 12): Promise<Book[]> {
  try {
    const response = await getCatalogBooks({ page: 1, pageSize: limit });
    return response.results;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getGenresPage(
  params: OffsetPageParams
): Promise<GenreSearchResponse> {
  const searchParams = buildLimitOffsetParams(params);

  try {
    const response = await getData<LimitOffsetApiResponse<CatalogGenre>>(
      `/api/v1/genres/?${searchParams.toString()}`
    );
    return normalizeLimitOffsetResponse(response, params);
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getGenres(limit = 50): Promise<CatalogGenre[]> {
  try {
    const response = await getGenresPage({ page: 1, pageSize: limit });
    return response.results;
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
    const response = await getData<LimitOffsetApiResponse<Book>>(
      `/api/v1/authors/${id}/books/?limit=24`
    );
    return response.results;
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

export async function getFeedActivities(
  params: CursorPageParams = { pageSize: 20 }
): Promise<FeedActivityResponse> {
  try {
    const response = await getData<FeedActivityResponse>(buildFeedUrl(params));
    return response;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function searchBooks(input: SearchBooksInput): Promise<BookSearchResponse> {
  const search = normalizeSearchInput(input);
  const params = new URLSearchParams({
    q: search.query,
    page: String(search.page),
    page_size: String(search.pageSize),
  });

  try {
    const response = await getData<PageNumberApiResponse<Book>>(
      `/api/v1/books/search-results/?${params.toString()}`
    );
    return normalizePageNumberResponse(response, search);
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getReviews(
  id: string | undefined,
  sort?: ReviewSortParams
): Promise<BookReview[]> {
  const params = new URLSearchParams();
  if (sort) {
    params.set("sort_by", sort.sortBy);
    params.set("order", sort.order);
  }
  const query = params.size > 0 ? `?${params.toString()}` : "";

  try {
    const response = await getData<BookReview[]>(
      `/api/v1/books/${id}/reviews/${query}`
    );
    return response;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function updateReview(
  reviewId: string | number,
  reviewText: string,
  token?: string | null
): Promise<BookReview> {
  try {
    const response = await patchData<BookReview, { review_text: string }>(
      `/api/v1/reviews/${reviewId}/`,
      { review_text: reviewText },
      {
        headers: authHeaders(token),
      }
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
