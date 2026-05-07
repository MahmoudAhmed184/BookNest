import type {
  CursorApiResponse,
  OffsetPaginatedResponse,
} from "../../../types/api";

export interface Author {
  author_id?: number;
  name: string;
  number_of_books?: number;
  description?: string | null;
}

export interface CatalogGenre {
  id: number;
  name: string;
  description?: string | null;
  book_count?: number;
}

export interface Book {
  isbn13: string;
  isbn?: string | null;
  title: string;
  authors?: Author[] | string[];
  author?: string;
  genres?: string[];
  average_rate?: number | string | null;
  description?: string | null;
  publication_date?: string | null;
  date?: string;
  number_of_pages?: number | null;
  cover_img?: string | null;
  number_of_ratings?: number;
  reviews_count?: number;
  language?: string | null;
  source?: string | null;
}

export type BookSearchResponse = OffsetPaginatedResponse<Book>;

export type AuthorSearchResponse = OffsetPaginatedResponse<Author>;

export interface BookSuggestionsResponse {
  query: string;
  suggestions: Book[];
  count: number;
}

export type GenreSearchResponse = OffsetPaginatedResponse<CatalogGenre>;

export interface BookReview {
  review_id: string | number;
  review_text: string;
  created_at?: string;
  updated_at?: string;
  upvotes_count?: number;
  downvotes_count?: number;
  net_votes?: number;
  book?: string;
  username?: string;
  book_title?: string | null;
  has_upvoted?: boolean;
  has_downvoted?: boolean;
  user_vote_type?: "upvote" | "downvote" | null;
  profile_pic?: string | null;
  profile_id?: number | null;
  book_cover?: string | null;
}

export interface BookRating {
  rate_id: string | number;
  rate: number;
  created_at?: string;
  book?: string;
  username?: string;
  book_title?: string | null;
  book_average_rate?: number | string | null;
}

export interface RecommendedBook {
  book: string;
  book_title: string;
  book_author?: string | null;
  book_cover?: string | null;
}

export interface RecommendationRefreshOptions {
  n_recommendations?: number;
  async?: boolean;
  model_id?: number | string;
}

export interface AsyncRecommendationRefreshResponse {
  task_id?: string;
  message?: string;
  recommendations?: RecommendedBook[];
}

export type RecommendationRefreshResponse =
  | RecommendedBook[]
  | AsyncRecommendationRefreshResponse;

export interface RecommendationModel {
  id: number;
  model_type: string;
  created_at?: string;
  is_active?: boolean;
  min_ratings_per_user?: number;
  n_factors?: number;
  knn_k?: number;
  rmse?: number | null;
  mae?: number | null;
}

export interface FeedActivity {
  id: string;
  username: string;
  action: string;
  timestamp: string;
  book: {
    id: string;
    title: string;
    cover?: string | null;
  };
}

export type FeedActivityResponse = CursorApiResponse<FeedActivity>;

export interface CreateReviewPayload {
  book: string | undefined;
  review_text: string;
}

export type ReviewSortBy = "created_at" | "upvotes";
export type ReviewSortOrder = "asc" | "desc";

export interface ReviewSortParams {
  sortBy: ReviewSortBy;
  order: ReviewSortOrder;
}

export interface CreateRatingPayload {
  book: string | undefined;
  rate: number;
}

export interface DeleteBookPayload {
  book_id: string | undefined;
  list_id: number | null;
}

export interface BookAuthorPayload {
  name: string;
  author_id?: number;
}

export interface BookWritePayload {
  isbn13?: string;
  isbn?: string | null;
  title?: string;
  authors?: BookAuthorPayload[];
  genres?: string[];
  average_rate?: number | string | null;
  description?: string | null;
  publication_date?: string | null;
  number_of_pages?: number | null;
  cover_img?: string | null;
  language?: string | null;
}
