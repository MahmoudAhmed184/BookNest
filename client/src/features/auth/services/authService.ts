import { authHeaders, postData, throwApiError } from "../../../lib/axios";
import type { ApiEnvelope } from "../../../types/api";
import type { UserProfile } from "../../profile/types/user";
import type { AuthTokens, LoginPayload, RegisterPayload } from "../types/auth";

export async function createProfile(token?: string | null): Promise<UserProfile> {
  try {
    return await postData<UserProfile, Record<string, never>>(
      "/api/v1/profiles/",
      {},
      {
        headers: authHeaders(token),
      }
    );
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function login(
  formData: LoginPayload
): Promise<AuthTokens> {
  try {
    const response = await postData<ApiEnvelope<AuthTokens>, LoginPayload>(
      "/api/v1/auth/sessions/",
      formData
    );

    return response.data;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function register(
  formData: RegisterPayload
): Promise<AuthTokens> {
  try {
    const response = await postData<ApiEnvelope<AuthTokens>, RegisterPayload>(
      "/api/v1/users/",
      formData
    );

    return response.data;
  } catch (error: unknown) {
    throwApiError(error);
  }
}
