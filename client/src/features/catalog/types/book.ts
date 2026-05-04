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
  moods?: string[];
  pace?: string | null;
}

export interface BookSearchResponse {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: Book[];
}

export interface GenreSearchResponse {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: CatalogGenre[];
}

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
  book_cover?: string | null;
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

export interface CreateReviewPayload {
  book: string | undefined;
  review_text: string;
}

export interface CreateRatingPayload {
  book: string | undefined;
  rate: number;
}

export interface DeleteBookPayload {
  book_id: string | undefined;
  list_id: number | null;
}
