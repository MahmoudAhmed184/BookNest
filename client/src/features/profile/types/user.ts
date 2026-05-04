import type { BookRating, BookReview } from "../../catalog/types/book";

export interface ProfileInterest {
  interest: string;
}

export interface ProfileSocialLink {
  platform: string;
  url: string;
}

export interface UserProfile {
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

export interface ProfileResponseEnvelope {
  data: {
    profile: UserProfile;
  };
}

export interface UpdateUserPayload {
  username?: string;
  bio?: string;
}

export interface UpdateBioPayload {
  bio: string;
}

export interface UploadProfilePictureResponse {
  profile_pic?: string | null;
  detail?: string;
}

export type UserReviewsResponse = BookReview[];
export type UserRatingsResponse = BookRating[];
