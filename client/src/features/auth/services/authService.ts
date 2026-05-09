import {
  authHeaders,
  getData,
  postData,
  throwApiError,
} from "../../../lib/axios";
import { normalizeEmptyResponse } from "../../../lib/normalizers";
import type {
  CreateProfilePayload,
  Profile,
} from "../../profile/types/user";
import type {
  AuthenticatedUser,
  AuthTokens,
  ChangePasswordPayload,
  LoginPayload,
  RegisterPayload,
} from "../types/auth";

interface AuthApiResponse {
  access: string;
  refresh: string;
  user: AuthenticatedUser;
}

interface RegistrationApiPayload {
  name: string;
  email: string;
  password1: string;
  password2: string;
}

interface LogoutPayload {
  refresh?: string;
}

interface PasswordChangeResponse {
  detail?: string;
}

export async function createProfile(
  data: CreateProfilePayload,
  token?: string | null
): Promise<Profile> {
  try {
    return await postData<Profile, CreateProfilePayload>("/api/v1/profiles/", data, {
      headers: authHeaders(token),
    });
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getCurrentUser(
  token?: string | null
): Promise<AuthenticatedUser> {
  try {
    return await getData<AuthenticatedUser>("/api/v1/users/me/", {
      headers: authHeaders(token),
    });
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function login(formData: LoginPayload): Promise<AuthTokens> {
  try {
    const response = await postData<AuthApiResponse, LoginPayload>(
      "/api/v1/auth/login/",
      formData
    );

    return {
      access: response.access,
      refresh: response.refresh,
      user: response.user,
    };
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function register(
  formData: RegisterPayload
): Promise<AuthTokens> {
  const payload: RegistrationApiPayload = {
    name: formData.name,
    email: formData.email,
    password1: formData.password1,
    password2: formData.password2,
  };

  try {
    const response = await postData<AuthApiResponse, RegistrationApiPayload>(
      "/api/v1/auth/registration/",
      payload
    );

    return {
      access: response.access,
      refresh: response.refresh,
      user: response.user,
    };
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function logoutCurrentSession(
  refreshToken?: string | null
): Promise<void> {
  const data: LogoutPayload = refreshToken ? { refresh: refreshToken } : {};

  try {
    await postData<void, LogoutPayload>("/api/v1/auth/logout/", data);
    return normalizeEmptyResponse();
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function changePassword(
  data: ChangePasswordPayload,
  token?: string | null
): Promise<PasswordChangeResponse> {
  try {
    return await postData<PasswordChangeResponse, ChangePasswordPayload>(
      "/api/v1/auth/password/change/",
      data,
      { headers: authHeaders(token) }
    );
  } catch (error: unknown) {
    throwApiError(error);
  }
}
