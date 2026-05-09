import type { OffsetPaginatedResponse } from "../../../types/api";

export interface Author {
  id: number;
  name: string;
  normalized_name?: string;
  slug?: string;
  bio?: string;
  photo?: string | null;
  photo_fallback_url?: string | null;
  birth_date?: string | null;
  death_date?: string | null;
  source?: string;
  books_count?: number;
  like_count?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface Genre {
  id: number;
  name: string;
  normalized_name?: string;
  slug?: string;
  description?: string;
  parent?: number | null;
  books_count?: number;
  is_featured?: boolean;
  carousel_rank?: number | null;
  created_at?: string;
  updated_at?: string;
}

export type CatalogGenre = Genre;

export interface AuthorLike {
  id: number;
  user: number;
  author: number;
  created_at?: string;
  updated_at?: string;
}

export interface Book {
  id: number;
  title: string;
  subtitle?: string;
  slug?: string;
  description?: string;
  isbn_13?: string | null;
  isbn_10?: string | null;
  authors?: Author[];
  genres?: Genre[];
  related_books?: number[];
  cover?: string | null;
  cover_fallback_url?: string | null;
  publisher?: string;
  publication_date?: string | null;
  publication_year?: number | null;
  page_count?: number | null;
  language?: string;
  source?: string;
  source_updated_at?: string | null;
  external_last_synced_at?: string | null;
  average_rating?: number | string;
  rating_count?: number;
  review_count?: number;
  collection_count?: number;
  read_count?: number;
  author_names?: string;
  genre_labels?: string;
  is_featured?: boolean;
  featured_rank?: number | null;
  popularity_score?: number | string;
  trending_score?: number | string;
  is_adult?: boolean;
  is_public?: boolean;
  is_archived?: boolean;
  archived_at?: string | null;
  archive_reason?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RelatedBook {
  id: number;
  from_book: number;
  to_book: Book;
  relation_type: string;
  score: number | string;
  source?: string;
  created_at?: string;
  updated_at?: string;
}

export type BookSearchResponse = OffsetPaginatedResponse<Book>;

export type AuthorSearchResponse = OffsetPaginatedResponse<Author>;

export type GenreSearchResponse = OffsetPaginatedResponse<CatalogGenre>;

export interface BookSearchApiResponse {
  query: string;
  results: Book[];
}

export interface SearchAutocompleteTerm {
  id: number;
  term: string;
  normalized_term: string;
  term_type: string;
  weight: number;
  use_count: number;
  target_content_type?: number | null;
  target_object_id?: number | null;
  last_seen_at?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BookReview {
  id: number;
  user: number;
  user_detail?: {
    id: number;
    name?: string;
    email?: string;
    display_name?: string;
    first_name?: string;
    last_name?: string;
    profile_picture?: string | null;
    profile_picture_fallback_url?: string | null;
  };
  book: number;
  book_detail?: Book;
  rating?: number | null;
  title?: string;
  body: string;
  contains_spoilers?: boolean;
  is_edited?: boolean;
  edited_at?: string | null;
  reviewed_at?: string;
  upvote_count?: number;
  downvote_count?: number;
  score?: number;
  is_archived?: boolean;
  created_at?: string;
  updated_at?: string;
  can_edit?: boolean;
}

export interface BookRating {
  id: number;
  user: number;
  book: number;
  book_detail?: Book;
  value: number;
  rated_at?: string;
  is_archived?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type ReviewVoteType = "up" | "down";

export interface ReviewVote {
  id: number;
  user: number;
  review: number;
  vote_type: ReviewVoteType;
  created_at?: string;
  updated_at?: string;
}

export interface UserRecommendation {
  id: number;
  user: number;
  book: number;
  book_detail?: Book;
  model: number;
  source: string;
  rank: number;
  score: number | string;
  reason?: Record<string, unknown>;
  generated_at?: string;
  expires_at?: string | null;
  is_active?: boolean;
  is_dismissed?: boolean;
  viewed_at?: string | null;
  clicked_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CatalogRecommendation {
  id: number;
  book: number;
  book_detail?: Book;
  source: string;
  rank: number;
  score: number | string;
  generated_at?: string;
  is_active?: boolean;
  reason?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export type RecommendationFeedbackType =
  | "viewed"
  | "clicked"
  | "dismissed"
  | "not_interested"
  | "saved"
  | "read";

export interface RecommendationFeedback {
  id: number;
  user: number;
  book: number;
  recommendation?: number | null;
  feedback_type: RecommendationFeedbackType;
  payload?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface RecommendationFeedbackPayload {
  book: number;
  recommendation?: number | null;
  feedback_type: RecommendationFeedbackType;
  payload?: Record<string, unknown>;
}

export interface RecommendationModel {
  id: number;
  name: string;
  version: string;
  model_type: string;
  is_active?: boolean;
  rmse?: number | string | null;
  mae?: number | string | null;
  min_ratings_threshold?: number;
  generated_at?: string;
  training_sample_size?: number;
  artifact_uri?: string;
  metrics?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface FeedEvent {
  id: number;
  actor: number;
  actor_detail?: {
    id: number;
    name?: string;
    email?: string;
    display_name?: string;
    first_name?: string;
    last_name?: string;
    profile_picture?: string | null;
    profile_picture_fallback_url?: string | null;
  };
  event_type: string;
  book?: number | null;
  book_detail?: Book | null;
  target_label?: string | null;
  action_object_label?: string | null;
  visibility: string;
  occurred_at?: string;
  payload?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface CreateReviewPayload {
  book: number | undefined;
  rating?: number | null;
  title?: string;
  body: string;
  contains_spoilers?: boolean;
}

export type ReviewSortBy = "reviewed_at" | "upvote_count";
export type ReviewSortOrder = "asc" | "desc";

export interface ReviewSortParams {
  sortBy: ReviewSortBy;
  order: ReviewSortOrder;
}

export interface CreateRatingPayload {
  book: number | undefined;
  value: number;
}

export interface DeleteBookPayload {
  collection_book_id: number;
}

export interface BookWritePayload {
  title?: string;
  subtitle?: string;
  description?: string;
  isbn_13?: string | null;
  isbn_10?: string | null;
  author_ids?: number[];
  genre_ids?: number[];
  cover?: string | null;
  cover_fallback_url?: string | null;
  publisher?: string;
  publication_date?: string | null;
  publication_year?: number | null;
  page_count?: number | null;
  language?: string;
  source?: string;
  is_featured?: boolean;
  featured_rank?: number | null;
  is_adult?: boolean;
  is_public?: boolean;
}
