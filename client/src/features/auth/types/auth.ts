import type { AuthEnvelopeMeta } from "../../../lib/normalizers";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  handle: string;
  email: string;
  password1: string;
  password2: string;
}

export interface AuthenticatedUser {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  is_staff?: boolean;
  is_active?: boolean;
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

export interface ChangePasswordPayload {
  old_password: string;
  new_password1: string;
  new_password2: string;
}
