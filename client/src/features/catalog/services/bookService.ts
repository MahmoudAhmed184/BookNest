import {
  authHeaders,
  deleteData,
  getData,
  patchData,
  postData,
  throwApiError,
  throwApiRequestError,
} from "../../../lib/axios";
import {
  normalizeEmptyResponse,
  normalizeListResponse,
  normalizePaginatedList,
} from "../../../lib/normalizers";
import type {
  CursorApiResponse,
  LimitOffsetApiResponse,
  OffsetPageParams,
  OffsetPaginatedResponse,
} from "../../../types/api";
import type {
  Author,
  AuthorLike,
  AuthorSearchResponse,
  Book,
  BookRating,
  BookReview,
  BookSearchApiResponse,
  BookSearchResponse,
  BookWritePayload,
  CatalogGenre,
  CatalogRecommendation,
  CreateRatingPayload,
  CreateReviewPayload,
  DeleteBookPayload,
  FeedEvent,
  GenreSearchResponse,
  RecommendationFeedback,
  RecommendationFeedbackPayload,
  RecommendationModel,
  RelatedBook,
  ReviewSortParams,
  ReviewVote,
  ReviewVoteType,
  SearchAutocompleteTerm,
  UserRecommendation,
} from "../types/book";
import { getAuthorNames, getBookGenres } from "../utils/bookFacets";

export type SearchBooksOrdering =
  | "relevance"
  | "trending"
  | "popular"
  | "rating"
  | "newest"
  | "title";

interface SearchBooksParams extends OffsetPageParams {
  query: string;
  includeExternal?: boolean | undefined;
  author?: string | undefined;
  genre?: string | undefined;
  min_rating?: number | undefined;
  pub_date_from?: string | undefined;
  pub_date_to?: string | undefined;
  publication_year_from?: number | undefined;
  publication_year_to?: number | undefined;
  num_pages_min?: number | undefined;
  num_pages_max?: number | undefined;
  ordering?: SearchBooksOrdering | undefined;
}

export interface CatalogBookFilters {
  query?: string | undefined;
  author?: string | undefined;
  genre?: string | undefined;
  min_rating?: number | undefined;
  pub_date_from?: string | undefined;
  pub_date_to?: string | undefined;
  publication_year_from?: number | undefined;
  publication_year_to?: number | undefined;
  num_pages_min?: number | undefined;
  num_pages_max?: number | undefined;
  ordering?: SearchBooksOrdering | undefined;
}

interface CatalogBooksParams
  extends OffsetPageParams,
    CatalogBookFilters {}

interface GenreListParams extends OffsetPageParams {
  query?: string | undefined;
}

interface AuthorListParams extends OffsetPageParams {
  name__icontains?: string | undefined;
}

type SearchBooksInput = string | SearchBooksParams;
type ListResponse<T> = LimitOffsetApiResponse<T> | T[];
type FeedEventsResponse = CursorApiResponse<FeedEvent> | FeedEvent[];

interface SearchSuggestionResponse {
  suggestions: SearchAutocompleteTerm[];
}

interface RelatedBookSuggestionResponse {
  suggestions: Book[];
}

interface RecommendationRunResponse {
  id: number;
  status: string;
}

function isListResponse<T>(
  response: ListResponse<T> | RecommendationRunResponse
): response is ListResponse<T> {
  return Array.isArray(response) || "results" in response;
}

const defaultSearchPageParams: OffsetPageParams = {
  page: 1,
  pageSize: 24,
};

function pageFromArray<T>(
  items: T[],
  params: OffsetPageParams
): OffsetPaginatedResponse<T> {
  const start = (params.page - 1) * params.pageSize;
  const results = items.slice(start, start + params.pageSize);
  const totalPages =
    items.length > 0 ? Math.ceil(items.length / params.pageSize) : 0;

  return {
    count: items.length,
    next: params.page < totalPages ? String(params.page + 1) : null,
    previous: params.page > 1 ? String(params.page - 1) : null,
    results,
    page: params.page,
    pageSize: params.pageSize,
    totalPages,
    hasNext: params.page < totalPages,
    hasPrevious: params.page > 1,
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

function numericValue(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function filterBooks(books: Book[], filters: CatalogBookFilters): Book[] {
  return books.filter((book) => {
    const authors = getAuthorNames(book).toLowerCase();
    const genres = getBookGenres(book).map((genre) => genre.toLowerCase());
    const rating = numericValue(book.average_rating);
    const pageCount = book.page_count ?? 0;
    const publicationDate = book.publication_date ?? "";
    const publicationYear =
      book.publication_year ??
      (publicationDate ? Number.parseInt(publicationDate.slice(0, 4), 10) : null);

    if (filters.author && !authors.includes(filters.author.toLowerCase())) {
      return false;
    }

    if (
      filters.genre &&
      !genres.includes(filters.genre.trim().toLowerCase())
    ) {
      return false;
    }

    if (
      typeof filters.min_rating === "number" &&
      (rating === null || rating < filters.min_rating)
    ) {
      return false;
    }

    if (filters.pub_date_from && publicationDate < filters.pub_date_from) {
      return false;
    }

    if (filters.pub_date_to && publicationDate > filters.pub_date_to) {
      return false;
    }

    if (
      typeof filters.publication_year_from === "number" &&
      (publicationYear === null || publicationYear < filters.publication_year_from)
    ) {
      return false;
    }

    if (
      typeof filters.publication_year_to === "number" &&
      (publicationYear === null || publicationYear > filters.publication_year_to)
    ) {
      return false;
    }

    if (
      typeof filters.num_pages_min === "number" &&
      pageCount < filters.num_pages_min
    ) {
      return false;
    }

    if (
      typeof filters.num_pages_max === "number" &&
      pageCount > filters.num_pages_max
    ) {
      return false;
    }

    return true;
  });
}

function sortReviews(
  reviews: BookReview[],
  sort?: ReviewSortParams
): BookReview[] {
  if (!sort) return reviews;

  const direction = sort.order === "asc" ? 1 : -1;
  const sorted = [...reviews].sort((a, b) => {
    if (sort.sortBy === "upvote_count") {
      return ((a.upvote_count ?? 0) - (b.upvote_count ?? 0)) * direction;
    }

    return (
      new Date(a.reviewed_at ?? a.created_at ?? 0).getTime() -
      new Date(b.reviewed_at ?? b.created_at ?? 0).getTime()
    ) * direction;
  });

  return sorted;
}

function buildQuery(
  params: Record<string, string | number | boolean | undefined | null>
): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  return searchParams.size > 0 ? `?${searchParams.toString()}` : "";
}

function apiPathFromUrl(url: string): string {
  if (!/^https?:\/\//i.test(url)) return url;

  const parsed = new URL(url);
  return `${parsed.pathname}${parsed.search}`;
}

export async function getBooks(
  query: string,
  filters: CatalogBookFilters = {}
): Promise<BookSearchResponse> {
  const response = await searchBooks({
    query,
    page: 1,
    pageSize: 50,
  });

  return {
    ...response,
    results: filterBooks(response.results, filters),
  };
}

export async function getSuggestions(
  query: string,
  limit = 8,
  type?: string | undefined
): Promise<SearchAutocompleteTerm[]> {
  return getSearchAutocomplete(query, type, limit);
}

export async function getCatalogBooks(
  params: CatalogBooksParams
): Promise<BookSearchResponse> {
  const rawCatalogQuery =
    params.query?.trim() ||
    params.author?.trim() ||
    params.genre?.trim() ||
    "";
  const catalogQuery = rawCatalogQuery.length >= 2 ? rawCatalogQuery : "";

  return searchBooks({
    query: catalogQuery,
    page: params.page,
    pageSize: params.pageSize,
    genre: params.genre,
    min_rating: params.min_rating,
    pub_date_from: params.pub_date_from,
    pub_date_to: params.pub_date_to,
    publication_year_from: params.publication_year_from,
    publication_year_to: params.publication_year_to,
    num_pages_min: params.num_pages_min,
    num_pages_max: params.num_pages_max,
    ordering: params.ordering,
  });
}

export async function getPopularBooks(limit = 12): Promise<Book[]> {
  try {
    const recommendations = await getCatalogRecommendations("popular");
    const books = recommendations
      .map((recommendation) => recommendation.book_detail)
      .filter((book): book is Book => Boolean(book));

    if (books.length > 0) return books.slice(0, limit);

    const response = await getCatalogBooks({ page: 1, pageSize: limit });
    return response.results;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getNewReleaseBooks(limit = 12): Promise<Book[]> {
  const query = buildQuery({
    ordering: "newest",
    page: 1,
    page_size: limit,
  });

  try {
    const response = await getData<ListResponse<Book>>(`/api/v1/books/${query}`);
    return normalizeListResponse(response).slice(0, limit);
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getGenresPage(
  params: GenreListParams
): Promise<GenreSearchResponse> {
  const query = buildQuery({
    q: params.query?.trim(),
    page: params.page,
    page_size: params.pageSize,
    ordering: "books",
  });

  try {
    const genres = await getData<ListResponse<CatalogGenre>>(
      `/api/v1/genres/${query}`
    );
    return normalizePaginatedList(genres, params);
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

export async function getGenreOptions(
  query: string,
  limit = 20
): Promise<CatalogGenre[]> {
  const requestQuery = buildQuery({
    q: query.trim(),
    page_size: limit,
    ordering: "books",
  });

  try {
    const response = await getData<ListResponse<CatalogGenre>>(
      `/api/v1/genres/${requestQuery}`
    );
    return normalizeListResponse(response).slice(0, limit);
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getGenreBooks(
  genreId: string | number | undefined,
  params: CatalogBooksParams
): Promise<BookSearchResponse> {
  const query = buildQuery({
    page: 1,
    page_size: 100,
  });

  try {
    const response = await getData<ListResponse<Book>>(
      `/api/v1/genres/${genreId}/books/${query}`
    );
    const books = normalizeListResponse(response);
    return pageFromArray(filterBooks(books, params), params);
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getBook(id: string | undefined): Promise<Book> {
  try {
    return await getData<Book>(`/api/v1/books/${id}/`);
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function createBook(
  data: BookWritePayload,
  token?: string | null
): Promise<Book> {
  try {
    return await postData<Book, BookWritePayload>("/api/v1/books/", data, {
      headers: authHeaders(token),
    });
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function updateBook(
  id: string | number,
  data: BookWritePayload,
  token?: string | null
): Promise<Book> {
  try {
    return await patchData<Book, BookWritePayload>(`/api/v1/books/${id}/`, data, {
      headers: authHeaders(token),
    });
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getAuthors(
  params: AuthorListParams
): Promise<AuthorSearchResponse> {
  const requestQuery = buildQuery({
    q: params.name__icontains?.trim(),
    page: params.page,
    page_size: params.pageSize,
  });

  try {
    const authors = await getData<ListResponse<Author>>(
      `/api/v1/authors/${requestQuery}`
    );
    return normalizePaginatedList(authors, params);
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getAuthor(id: string | undefined): Promise<Author> {
  try {
    return await getData<Author>(`/api/v1/authors/${id}/`);
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getAuthorBooks(id: string | undefined): Promise<Book[]> {
  const query = buildQuery({ page_size: 100 });

  try {
    const response = await getData<ListResponse<Book>>(
      `/api/v1/authors/${id}/books/${query}`
    );
    return normalizeListResponse(response);
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function listAuthorLikes(
  token?: string | null
): Promise<AuthorLike[]> {
  const query = buildQuery({ page_size: 100 });

  try {
    const response = await getData<ListResponse<AuthorLike>>(`/api/v1/author-likes/${query}`, {
      headers: authHeaders(token),
    });
    return normalizeListResponse(response);
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function likeAuthor(
  author: number,
  token?: string | null
): Promise<AuthorLike> {
  try {
    return await postData<AuthorLike, { author: number }>(
      "/api/v1/author-likes/",
      { author },
      { headers: authHeaders(token) }
    );
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function unlikeAuthor(
  authorLikeId: number,
  token?: string | null
): Promise<void> {
  try {
    await deleteData<void>(`/api/v1/author-likes/${authorLikeId}/`, {
      headers: authHeaders(token),
    });
    return normalizeEmptyResponse();
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getRelatedBooks(
  id: string | undefined
): Promise<Book[]> {
  const query = buildQuery({ page_size: 12 });

  try {
    const response = await getData<ListResponse<RelatedBook>>(
      `/api/v1/books/${id}/related-books/${query}`
    );
    const relatedBooks = normalizeListResponse(response)
      .map((relatedBook) => relatedBook.to_book)
      .filter(Boolean);

    if (relatedBooks.length > 0) {
      return relatedBooks;
    }

    const suggestionQuery = buildQuery({ book_id: id, limit: 12 });
    const suggestions = await getData<RelatedBookSuggestionResponse>(
      `/api/v1/search/related-books/${suggestionQuery}`
    );
    return suggestions.suggestions;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getFeedEvents(
  pageUrl?: string | undefined,
  pageSize = 20
): Promise<CursorApiResponse<FeedEvent>> {
  const url = pageUrl
    ? apiPathFromUrl(pageUrl)
    : `/api/v1/feed-events/${buildQuery({ page_size: pageSize })}`;

  try {
    const response = await getData<FeedEventsResponse>(url);

    if (Array.isArray(response)) {
      return {
        next: null,
        previous: null,
        results: response,
      };
    }

    return {
      next: response.next ?? null,
      previous: response.previous ?? null,
      results: response.results,
    };
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function searchBooks(input: SearchBooksInput): Promise<BookSearchResponse> {
  const search = normalizeSearchInput(input);
  const query = buildQuery({
    q: search.query,
    page: search.page,
    page_size: search.pageSize,
    include_external: search.includeExternal,
    authors: search.author?.trim(),
    genres: search.genre?.trim(),
    min_rating: search.min_rating,
    pub_date_from: search.pub_date_from,
    pub_date_to: search.pub_date_to,
    publication_year_from: search.publication_year_from,
    publication_year_to: search.publication_year_to,
    page_count_min: search.num_pages_min,
    page_count_max: search.num_pages_max,
    ordering: search.ordering,
  });

  try {
    const response = await getData<BookSearchApiResponse>(
      `/api/v1/search/books/${query}`
    );
    return normalizePaginatedList(response, search);
  } catch (error: unknown) {
    throwApiRequestError(error);
  }
}

async function getSearchAutocomplete(
  query: string,
  type: string | undefined = undefined,
  limit = 20
): Promise<SearchAutocompleteTerm[]> {
  const requestQuery = buildQuery({ q: query, type, limit, page_size: limit });

  try {
    const response = await getData<
      SearchSuggestionResponse | ListResponse<SearchAutocompleteTerm>
    >(
      `/api/v1/search/autocomplete/${requestQuery}`
    );
    const terms =
      "suggestions" in response
        ? response.suggestions
        : normalizeListResponse(response);
    return terms.slice(0, limit);
  } catch (error: unknown) {
    throwApiRequestError(error);
  }
}

export async function getReviews(
  id: string | undefined,
  sort?: ReviewSortParams
): Promise<BookReview[]> {
  const query = buildQuery({ page_size: 100 });

  try {
    const response = await getData<ListResponse<BookReview>>(
      `/api/v1/books/${id}/reviews/${query}`
    );
    const reviews = normalizeListResponse(response);
    return sortReviews(reviews, sort);
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function updateReview(
  reviewId: string | number,
  body: string,
  token?: string | null
): Promise<BookReview> {
  try {
    return await patchData<BookReview, { body: string }>(
      `/api/v1/reviews/${reviewId}/`,
      { body },
      { headers: authHeaders(token) }
    );
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function createReview(
  data: CreateReviewPayload,
  token?: string | null
): Promise<BookReview> {
  try {
    return await postData<BookReview, CreateReviewPayload>(
      "/api/v1/reviews/",
      data,
      { headers: authHeaders(token) }
    );
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function createRating(
  data: CreateRatingPayload,
  token?: string | null
): Promise<BookRating> {
  try {
    return await postData<BookRating, CreateRatingPayload>(
      "/api/v1/ratings/",
      data,
      { headers: authHeaders(token) }
    );
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getRatingForBook(
  id: string | undefined,
  token?: string | null
): Promise<BookRating | null> {
  if (!id || !token) return null;

  try {
    const response = await getData<ListResponse<BookRating>>("/api/v1/ratings/?mine=true&page_size=100", {
      headers: authHeaders(token),
    });
    const ratings = normalizeListResponse(response);
    return ratings.find((rating) => String(rating.book) === String(id)) ?? null;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function updateRating(
  ratingId: string | number,
  value: number,
  token?: string | null
): Promise<BookRating> {
  try {
    return await patchData<BookRating, { value: number }>(
      `/api/v1/ratings/${ratingId}/`,
      { value },
      { headers: authHeaders(token) }
    );
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function deleteRating(
  ratingId: string | number,
  token?: string | null
): Promise<void> {
  try {
    await deleteData<void>(`/api/v1/ratings/${ratingId}/`, {
      headers: authHeaders(token),
    });
    return normalizeEmptyResponse();
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getBookRatings(
  id: string | undefined,
  token?: string | null
): Promise<BookRating[]> {
  const query = buildQuery({ page_size: 100 });

  try {
    const response = await getData<ListResponse<BookRating>>(`/api/v1/books/${id}/ratings/${query}`, {
      headers: authHeaders(token),
    });
    return normalizeListResponse(response);
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function listReviewVotes(
  token?: string | null
): Promise<ReviewVote[]> {
  const query = buildQuery({ page_size: 100 });

  try {
    const response = await getData<ListResponse<ReviewVote>>(`/api/v1/review-votes/${query}`, {
      headers: authHeaders(token),
    });
    return normalizeListResponse(response);
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function voteOnReview(
  reviewId: string | number,
  voteType: ReviewVoteType,
  token?: string | null
): Promise<ReviewVote> {
  try {
    return await postData<ReviewVote, { vote_type: ReviewVoteType }>(
      `/api/v1/reviews/${reviewId}/votes/`,
      { vote_type: voteType },
      { headers: authHeaders(token) }
    );
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function deleteReviewVote(
  reviewId: string | number,
  token?: string | null
): Promise<void> {
  try {
    await deleteData<void>(`/api/v1/reviews/${reviewId}/votes/`, {
      headers: authHeaders(token),
    });
    return normalizeEmptyResponse();
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function deleteBook(
  id: string | number,
  token?: string | null
): Promise<void>;
export async function deleteBook(
  data: DeleteBookPayload,
  token?: string | null
): Promise<void>;
export async function deleteBook(
  data: string | number | DeleteBookPayload,
  token?: string | null
): Promise<void> {
  if (typeof data === "object") {
    try {
      await deleteData<void>(
        `/api/v1/collection-books/${data.collection_book_id}/`,
        { headers: authHeaders(token) }
      );
      return normalizeEmptyResponse();
    } catch (error: unknown) {
      throwApiError(error);
    }
  }

  try {
    await deleteData<void>(`/api/v1/books/${data}/`, {
      headers: authHeaders(token),
    });
    return normalizeEmptyResponse();
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getRecommendedBooks(
  token?: string | null
): Promise<UserRecommendation[]> {
  const query = buildQuery({ page_size: 50 });

  try {
    const response = await getData<ListResponse<UserRecommendation>>(`/api/v1/recommendations/${query}`, {
      headers: authHeaders(token),
    });
    const recommendations = normalizeListResponse(response);

    if (recommendations.length > 0) {
      return recommendations;
    }

    try {
      const generated = await postData<
        ListResponse<UserRecommendation> | RecommendationRunResponse,
        { n_recommendations: number }
      >(
        "/api/v1/recommendations/generate/",
        { n_recommendations: 10 },
        { headers: authHeaders(token) }
      );

      return isListResponse<UserRecommendation>(generated)
        ? normalizeListResponse(generated)
        : [];
    } catch {
      return [];
    }
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function dismissRecommendation(
  id: number,
  token?: string | null
): Promise<void> {
  try {
    await postData<void, Record<string, never>>(
      `/api/v1/recommendations/${id}/dismiss/`,
      {},
      { headers: authHeaders(token) }
    );
    return normalizeEmptyResponse();
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function clickRecommendation(
  id: number,
  token?: string | null
): Promise<UserRecommendation> {
  try {
    return await postData<UserRecommendation, Record<string, never>>(
      `/api/v1/recommendations/${id}/click/`,
      {},
      { headers: authHeaders(token) }
    );
  } catch (error: unknown) {
    throwApiError(error);
  }
}

async function getCatalogRecommendations(
  source?: string
): Promise<CatalogRecommendation[]> {
  const query = buildQuery({ source, page_size: 50 });

  try {
    const response = await getData<ListResponse<CatalogRecommendation>>(
      `/api/v1/catalog-recommendations/${query}`
    );
    return normalizeListResponse(response);
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function createRecommendationFeedback(
  data: RecommendationFeedbackPayload,
  token?: string | null
): Promise<RecommendationFeedback> {
  try {
    return await postData<
      RecommendationFeedback,
      RecommendationFeedbackPayload
    >("/api/v1/recommendation-feedback/", data, {
      headers: authHeaders(token),
    });
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function listRecommendationModels(
  token?: string | null
): Promise<RecommendationModel[]> {
  const query = buildQuery({ page_size: 100 });

  try {
    const response = await getData<ListResponse<RecommendationModel>>(
      `/api/v1/recommendation-models/${query}`,
      { headers: authHeaders(token) }
    );
    return normalizeListResponse(response);
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function triggerRecommendationRefresh(
  modelId: number,
  token?: string | null
): Promise<RecommendationRunResponse> {
  try {
    return await postData<
      RecommendationRunResponse,
      { model: number; run_type: "refresh"; status: "pending" }
    >(
      "/api/v1/recommendation-runs/",
      { model: modelId, run_type: "refresh", status: "pending" },
      { headers: authHeaders(token) }
    );
  } catch (error: unknown) {
    throwApiError(error);
  }
}
