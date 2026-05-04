import { authHeaders, postData, throwApiError } from "../../../lib/axios";
import type { ApiEnvelope } from "../../../types/api";
import type { UserProfile } from "../../profile/types/user";
import type { AuthTokens, LoginPayload, RegisterPayload } from "../types/auth";

export async function createProfile(): Promise<UserProfile> {
  try {
    return await postData<UserProfile, Record<string, never>>(
      "/api/users/profile/",
      {},
      {
        headers: authHeaders(),
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
      "/api/users/login/",
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
  console.log(formData);

  try {
    const response = await postData<ApiEnvelope<AuthTokens>, RegisterPayload>(
      "/api/users/register/",
      formData
    );

    return response.data;
  } catch (error: unknown) {
    throwApiError(error);
  }
}
