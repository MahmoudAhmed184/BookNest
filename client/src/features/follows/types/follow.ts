import type { UserProfile } from "../../profile/types/user";

export interface Follow {
  id: number;
  follower?: number;
  followed?: number;
  follower_detail?: UserProfile;
  followed_detail?: UserProfile;
  created_at?: string;
}

export interface FollowProfileRow {
  id: number;
  profile: UserProfile;
  created_at?: string;
}
