import type { User } from "../../profile/types/user";
import type { OffsetPaginatedResponse } from "../../../types/api";

export interface FollowProfileSummary {
  id: number;
  handle: string;
  bio?: string;
  profile_type?: "reader" | "creator" | "librarian" | "staff";
  picture?: string | null;
  picture_fallback_url?: string | null;
  followers_count?: number;
  following_count?: number;
  reviews_count?: number;
  ratings_count?: number;
  books_read_count?: number;
  collections_count?: number;
}

export interface FollowRelationship {
  id: number;
  follower: number;
  follower_detail?: User;
  follower_profile?: FollowProfileSummary;
  following: number;
  following_detail?: User;
  following_profile?: FollowProfileSummary;
  created_at?: string;
  updated_at?: string;
}

export type Follow = FollowRelationship;
export type FollowRelationshipPage = OffsetPaginatedResponse<FollowRelationship>;
