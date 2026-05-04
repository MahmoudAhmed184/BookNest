import { authHeaders, getApiError, postData } from "./apiClient";
import type { ApiEnvelope, ApiResult } from "../types/api";
import type { AuthTokens, LoginPayload, RegisterPayload } from "../types/auth";
import type { UserProfile } from "../types/user";

export async function createProfile(): Promise<ApiResult<UserProfile>> {
  try {
    return await postData<UserProfile, Record<string, never>>(
      "/api/users/profile/",
      {},
      {
        headers: authHeaders(),
      }
    );
  } catch (error: unknown) {
    return getApiError(error);
  }
}

export async function login(
  formData: LoginPayload
): Promise<ApiResult<AuthTokens>> {
  try {
    const response = await postData<ApiEnvelope<AuthTokens>, LoginPayload>(
      "/api/users/login/",
      formData
    );

    return response.data;
  } catch (error: unknown) {
    return getApiError(error);
  }
}

export async function register(
  formData: RegisterPayload
): Promise<ApiResult<AuthTokens>> {
  console.log(formData);

  try {
    const response = await postData<ApiEnvelope<AuthTokens>, RegisterPayload>(
      "/api/users/register/",
      formData
    );

    return response.data;
  } catch (error: unknown) {
    return getApiError(error);
  }
}
