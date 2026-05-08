import {
  authHeaders,
  deleteData,
  getData,
  patchData,
  postData,
  throwApiError,
  throwApiRequestError,
} from "../../../lib/axios";
import { normalizeEmptyResponse } from "../../../lib/normalizers";
import type {
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

export interface SearchBooksParams extends OffsetPageParams {
  query: string;
  includeExternal?: boolean | undefined;
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

export interface AuthorListParams extends OffsetPageParams {
  name__icontains?: string | undefined;
}

type SearchBooksInput = string | SearchBooksParams;

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

function buildQuery(params: Record<string, string | undefined>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.set(key, value);
  });

  return searchParams.size > 0 ? `?${searchParams.toString()}` : "";
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
  limit = 5
): Promise<SearchAutocompleteTerm[]> {
  return getSearchAutocomplete(query, "book", limit);
}

export async function getCatalogBooks(
  params: CatalogBooksParams
): Promise<BookSearchResponse> {
  const catalogQuery = params.author?.trim() || params.genre?.trim() || "";
  const response = await searchBooks({
    query: catalogQuery,
    page: 1,
    pageSize: 50,
  });

  return pageFromArray(filterBooks(response.results, params), params);
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

export async function getGenresPage(
  params: OffsetPageParams
): Promise<GenreSearchResponse> {
  try {
    const genres = await getData<CatalogGenre[]>("/api/v1/genres/");
    return pageFromArray(genres, params);
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
    limit: String(limit),
  });

  try {
    return await getData<CatalogGenre[]>(`/api/v1/genres/${requestQuery}`);
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getGenreBooks(
  genreId: string | number | undefined,
  params: CatalogBooksParams
): Promise<BookSearchResponse> {
  try {
    const books = await getData<Book[]>(`/api/v1/genres/${genreId}/books/`);
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
  try {
    const authors = await getData<Author[]>("/api/v1/authors/");
    const query = params.name__icontains?.trim().toLowerCase();
    const filteredAuthors = query
      ? authors.filter((author) => author.name.toLowerCase().includes(query))
      : authors;

    return pageFromArray(filteredAuthors, params);
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
  try {
    return await getData<Book[]>(`/api/v1/authors/${id}/books/`);
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function listAuthorLikes(
  token?: string | null
): Promise<AuthorLike[]> {
  try {
    return await getData<AuthorLike[]>("/api/v1/author-likes/", {
      headers: authHeaders(token),
    });
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
): Promise<RelatedBook[]> {
  try {
    return await getData<RelatedBook[]>(
      `/api/v1/books/${id}/related-books/`
    );
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getFeedEvents(): Promise<FeedEvent[]> {
  try {
    return await getData<FeedEvent[]>("/api/v1/feed-events/");
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function searchBooks(input: SearchBooksInput): Promise<BookSearchResponse> {
  const search = normalizeSearchInput(input);
  const query = buildQuery({ q: search.query });

  try {
    const response = await getData<BookSearchApiResponse>(
      `/api/v1/search/books/${query}`
    );
    return pageFromArray(response.results, search);
  } catch (error: unknown) {
    throwApiRequestError(error);
  }
}

export async function getSearchAutocomplete(
  query: string,
  type = "book",
  limit = 20
): Promise<SearchAutocompleteTerm[]> {
  const requestQuery = buildQuery({ q: query, type });

  try {
    const terms = await getData<SearchAutocompleteTerm[]>(
      `/api/v1/search/autocomplete/${requestQuery}`
    );
    return terms.slice(0, limit);
  } catch (error: unknown) {
    throwApiRequestError(error);
  }
}

export async function getReviews(
  id: string | undefined,
  sort?: ReviewSortParams
): Promise<BookReview[]> {
  try {
    const reviews = await getData<BookReview[]>(
      `/api/v1/books/${id}/reviews/`
    );
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
    const ratings = await getData<BookRating[]>("/api/v1/ratings/?mine=true", {
      headers: authHeaders(token),
    });
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
  try {
    return await getData<BookRating[]>(`/api/v1/books/${id}/ratings/`, {
      headers: authHeaders(token),
    });
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function listReviewVotes(
  token?: string | null
): Promise<ReviewVote[]> {
  try {
    return await getData<ReviewVote[]>("/api/v1/review-votes/", {
      headers: authHeaders(token),
    });
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
  try {
    return await getData<UserRecommendation[]>("/api/v1/recommendations/", {
      headers: authHeaders(token),
    });
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

export async function getCatalogRecommendations(
  source?: string
): Promise<CatalogRecommendation[]> {
  const query = buildQuery({ source });

  try {
    return await getData<CatalogRecommendation[]>(
      `/api/v1/catalog-recommendations/${query}`
    );
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
  try {
    return await getData<RecommendationModel[]>(
      "/api/v1/recommendation-models/",
      { headers: authHeaders(token) }
    );
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getRecommendationModel(
  id: string | number,
  token?: string | null
): Promise<RecommendationModel> {
  try {
    return await getData<RecommendationModel>(
      `/api/v1/recommendation-models/${id}/`,
      { headers: authHeaders(token) }
    );
  } catch (error: unknown) {
    throwApiError(error);
  }
}
