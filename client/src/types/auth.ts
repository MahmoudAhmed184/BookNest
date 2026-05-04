import type { UserProfile } from "./user";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password1: string;
  password2: string;
}

export interface AuthTokens {
  access: string;
  refresh?: string;
  user?: UserProfile;
}
