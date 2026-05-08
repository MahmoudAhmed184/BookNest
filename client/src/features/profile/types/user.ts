import type { BookRating, BookReview } from "../../catalog/types/book";
import type { ReadingCollection } from "../../collections/types/collection";
import type { OffsetPaginatedResponse } from "../../../types/api";

export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  is_active?: boolean;
  is_staff?: boolean;
  date_joined?: string;
  email_verified_at?: string | null;
  password_changed_at?: string | null;
  deactivated_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UserPreference {
  id: number;
  user: number;
  email_notifications_enabled: boolean;
  in_app_notifications_enabled: boolean;
  notify_on_follow: boolean;
  notify_on_review_vote: boolean;
  profile_public: boolean;
  show_ratings_publicly: boolean;
  personalized_recommendations_enabled: boolean;
  external_enrichment_enabled: boolean;
  search_history_enabled: boolean;
  mature_content_enabled: boolean;
  default_collection_privacy: "public" | "private";
  default_language?: string;
  timezone: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileInterest {
  id: number;
  genre: number;
  genre_name?: string;
  weight: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileInterestSelection {
  id?: number;
  genre: number;
  genre_name: string;
  weight: number;
}

export interface UserSocialLink {
  id: number;
  platform: string;
  url: string;
  label?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Profile {
  id: number;
  user: User;
  handle: string;
  bio?: string;
  profile_type?: "reader" | "creator" | "librarian" | "staff";
  picture?: string | null;
  picture_fallback_url?: string | null;
  location?: string;
  website_url?: string;
  interest_links?: ProfileInterest[];
  social_links?: UserSocialLink[];
  is_complete?: boolean;
  profile_completed_at?: string | null;
  completion_percent?: number;
  followers_count?: number;
  following_count?: number;
  reviews_count?: number;
  ratings_count?: number;
  books_read_count?: number;
  collections_count?: number;
  created_at?: string;
  updated_at?: string;
}

export type UserProfile = Profile;

export interface UpdateUserPayload {
  first_name?: string;
  last_name?: string;
  display_name?: string;
}

export interface UpdateProfilePayload {
  handle?: string;
  bio?: string;
  profile_type?: Profile["profile_type"];
  location?: string;
  website_url?: string;
}

export interface CreateProfilePayload extends UpdateProfilePayload {
  handle: string;
}

export interface CreateProfileInterestPayload {
  genre: number;
  weight?: number;
}

export type UpdateProfileInterestPayload =
  Partial<CreateProfileInterestPayload>;

export interface CreateUserSocialLinkPayload {
  platform: string;
  url: string;
  label?: string;
}

export type UpdateUserSocialLinkPayload =
  Partial<CreateUserSocialLinkPayload>;

export interface UploadProfilePictureResponse {
  picture: string;
  cloudinary?: Record<string, unknown>;
}

export type UserReviewsResponse = BookReview[];
export type UserRatingsResponse = BookRating[];

export interface ProfileViewerContext {
  is_self: boolean;
  is_following: boolean;
  can_view_private: boolean;
}

export interface ProfileOverviewStats {
  followers_count: number;
  following_count: number;
  reviews_count: number;
  ratings_count: number;
  collections_count: number;
  books_read_count: number;
}

export interface ProfileOverview {
  user: User;
  profile: Profile;
  viewer_context: ProfileViewerContext;
  stats: ProfileOverviewStats;
  recent_reviews: BookReview[];
  recent_ratings: BookRating[];
  recent_collections: ReadingCollection[];
}

export type UserReviewsPage = OffsetPaginatedResponse<BookReview>;
export type UserRatingsPage = OffsetPaginatedResponse<BookRating>;
export type UserCollectionsPage = OffsetPaginatedResponse<ReadingCollection>;

export interface UserDataAggregate {
  profile: Profile;
  viewer_context?: ProfileViewerContext;
  stats?: ProfileOverviewStats;
  reading_collections: ReadingCollection[];
  ratings: BookRating[];
  reviews: BookReview[];
}
