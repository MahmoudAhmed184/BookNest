import type { BookRating, BookReview } from "../../catalog/types/book";
import type { ReadingList } from "../../collections/types/collection";

export interface User {
  pk?: number;
  id?: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
  has_profile?: boolean;
}

export interface ProfileInterest {
  interest: string;
}

export interface ProfileSocialLink {
  platform: string;
  url: string;
}

export interface Profile {
  id: number;
  user_id: number;
  username: string;
  email?: string;
  full_name?: string | null;
  profile_pic?: string | null;
  bio?: string | null;
  profile_type?: string;
  interests?: ProfileInterest[];
  social_links?: ProfileSocialLink[];
  created_at?: string;
  updated_at?: string;
  interests_count?: number;
  social_links_count?: number;
  is_complete?: boolean;
}

export type UserProfile = Profile;

export interface ProfileResponseEnvelope {
  data: {
    profile: Profile;
  };
}

export interface UpdateUserPayload {
  username?: string;
  bio?: string;
}

export interface UpdateBioPayload {
  bio?: string;
  interests?: ProfileInterest[];
  social_links?: ProfileSocialLink[];
  profile_type?: string;
}

export interface UploadProfilePictureResponse {
  profile_pic_url: string;
  cloudinary_public_id: string;
}

export type UserReviewsResponse = BookReview[];
export type UserRatingsResponse = BookRating[];

export interface UserDataAggregate {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  profile: Profile;
  reading_lists: ReadingList[];
  ratings: BookRating[];
  reviews: BookReview[];
  total_books_rated?: number;
  total_books_reviewed?: number;
  total_reading_lists?: number;
}

export interface UserDataAggregateEnvelope {
  success: boolean;
  message?: string;
  data: UserDataAggregate;
}
