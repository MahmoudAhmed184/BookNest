import { authHeaders, postData, throwApiError } from "../../../lib/axios";
import {
  normalizeAuthEnvelope,
  normalizeProfileEnvelope,
  type AuthEnvelope,
  type ProfileEnvelope,
} from "../../../lib/normalizers";
import type { Profile } from "../../profile/types/user";
import type {
  AuthenticatedUser,
  AuthTokens,
  LoginPayload,
  RegisterPayload,
} from "../types/auth";

export async function createProfile(token?: string | null): Promise<Profile> {
  try {
    const response = await postData<ProfileEnvelope<Profile>, Record<string, never>>(
      "/api/v1/profiles/",
      {},
      {
        headers: authHeaders(token),
      }
    );

    return normalizeProfileEnvelope(response).profile;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function login(
  formData: LoginPayload
): Promise<AuthTokens> {
  try {
    const response = await postData<AuthEnvelope<AuthenticatedUser>, LoginPayload>(
      "/api/v1/auth/sessions/",
      formData
    );

    return normalizeAuthEnvelope(response);
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function register(
  formData: RegisterPayload
): Promise<AuthTokens> {
  try {
    const response = await postData<AuthEnvelope<AuthenticatedUser>, RegisterPayload>(
      "/api/v1/users/",
      formData
    );

    return normalizeAuthEnvelope(response);
  } catch (error: unknown) {
    throwApiError(error);
  }
}
