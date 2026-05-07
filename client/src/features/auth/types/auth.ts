import type { AuthEnvelopeMeta } from "../../../lib/normalizers";

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

export interface AuthenticatedUser {
  id: number;
  username: string;
  email: string;
  has_profile?: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  user: AuthenticatedUser;
  meta?: AuthEnvelopeMeta;
}

export interface EmailResetPayload {
  email: string;
}

export interface OtpResetPayload {
  otp: string;
}

export interface PasswordResetPayload {
  password: string;
  confirmPassword: string;
}
