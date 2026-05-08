import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { API_BASE_URL } from "../config/env";
import { routePaths } from "../routes/paths";
import type { ApiErrorResponse } from "../types/api";

export const ACCESS_TOKEN_STORAGE_KEY = "token";
export const REFRESH_TOKEN_STORAGE_KEY = "refreshToken";

const tokenRefreshPath = "/api/v1/auth/token/refresh/";
const tokenVerifyPath = "/api/v1/auth/token/verify/";
const profileRequiredDetail =
  "You must create a profile before accessing this feature";
const profileRequiredRedirectStorageKey = "profileRequiredRedirect";

interface TokenRefreshResponse {
  access: string;
  refresh?: string;
  access_expiration?: string;
  refresh_expiration?: string;
}

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export interface ProfileRequiredRedirectPayload {
  requiresProfile: true;
  actionRequired?: string;
  profileCreationUrl?: string;
}

type ProfileRequiredRedirectHandler = (
  payload: ProfileRequiredRedirectPayload
) => void;

let refreshPromise: Promise<string> | null = null;
let profileRequiredRedirectHandler: ProfileRequiredRedirectHandler =
  defaultProfileRequiredRedirectHandler;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export class ApiRequestError extends Error {
  status: number | undefined;
  data: ApiErrorResponse;
  retryAfterSeconds: number | undefined;

  constructor(
    message: string,
    data: ApiErrorResponse,
    status?: number,
    retryAfterSeconds?: number
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.data = data;
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function getStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function getSessionStorage(): Storage | null {
  try {
    return globalThis.sessionStorage ?? null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringField(
  source: Record<string, unknown> | undefined,
  key: string
): string | undefined {
  const value = source?.[key];
  return typeof value === "string" ? value : undefined;
}

function getProfileRequiredRedirectPayload(
  data: unknown
): ProfileRequiredRedirectPayload | null {
  if (!isRecord(data)) return null;

  const errors = isRecord(data.errors) ? data.errors : undefined;
  const meta = isRecord(data.meta) ? data.meta : undefined;

  if (stringField(errors, "detail") !== profileRequiredDetail) {
    return null;
  }

  const payload: ProfileRequiredRedirectPayload = {
    requiresProfile: true,
  };
  const actionRequired = stringField(meta, "action_required");
  const profileCreationUrl = stringField(meta, "profile_creation_url");

  if (actionRequired) {
    payload.actionRequired = actionRequired;
  }

  if (profileCreationUrl) {
    payload.profileCreationUrl = profileCreationUrl;
  }

  return payload;
}

function defaultProfileRequiredRedirectHandler(
  payload: ProfileRequiredRedirectPayload
): void {
  getSessionStorage()?.setItem(
    profileRequiredRedirectStorageKey,
    JSON.stringify(payload)
  );

  const params = new URLSearchParams({ requiresProfile: "true" });
  if (payload.actionRequired) {
    params.set("action_required", payload.actionRequired);
  }

  globalThis.location.assign(`${routePaths.register}?${params.toString()}`);
}

export function setProfileRequiredRedirectHandler(
  handler: ProfileRequiredRedirectHandler | null
): void {
  profileRequiredRedirectHandler =
    handler ?? defaultProfileRequiredRedirectHandler;
}

export function getStoredAccessToken(): string | null {
  return getStorage()?.getItem(ACCESS_TOKEN_STORAGE_KEY) ?? null;
}

export function getStoredRefreshToken(): string | null {
  return getStorage()?.getItem(REFRESH_TOKEN_STORAGE_KEY) ?? null;
}

export function setStoredAuthTokens(
  accessToken: string,
  refreshToken?: string | null
): void {
  const storage = getStorage();
  if (!storage) return;

  storage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
  if (refreshToken) {
    storage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  }
}

export function clearStoredAuthTokens(): void {
  const storage = getStorage();
  if (!storage) return;

  storage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  storage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

export function authHeaders(token?: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function setAuthorizationHeader(
  config: InternalAxiosRequestConfig,
  token: string
): void {
  const headers = AxiosHeaders.from(config.headers);
  headers.set("Authorization", `Bearer ${token}`);
  config.headers = headers;
}

function hasAuthorizationHeader(config: InternalAxiosRequestConfig): boolean {
  return AxiosHeaders.from(config.headers).has("Authorization");
}

function isTokenEndpoint(url: string | undefined): boolean {
  return Boolean(
    url?.includes(tokenRefreshPath) || url?.includes(tokenVerifyPath)
  );
}

async function requestAccessTokenRefresh(
  refreshToken?: string | null
): Promise<string> {
  const storedRefreshToken = refreshToken ?? getStoredRefreshToken();
  if (!storedRefreshToken) {
    throw new Error("Refresh token is missing");
  }

  const response = await axios.post<TokenRefreshResponse>(
    `${API_BASE_URL}${tokenRefreshPath}`,
    { refresh: storedRefreshToken }
  );
  const nextRefreshToken = response.data.refresh ?? storedRefreshToken;
  setStoredAuthTokens(response.data.access, nextRefreshToken);

  return response.data.access;
}

export async function refreshAccessToken(
  refreshToken?: string | null
): Promise<string> {
  refreshPromise ??= requestAccessTokenRefresh(refreshToken).finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function verifyAccessToken(token: string): Promise<void> {
  await axios.post(`${API_BASE_URL}${tokenVerifyPath}`, { token });
}

apiClient.interceptors.request.use((config) => {
  const token = getStoredAccessToken();
  if (token && !hasAuthorizationHeader(config)) {
    setAuthorizationHeader(config, token);
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as RetriableRequestConfig | undefined;
    const status = error.response?.status;
    const profileRequiredPayload =
      status === 403
        ? getProfileRequiredRedirectPayload(error.response?.data)
        : null;

    if (profileRequiredPayload) {
      profileRequiredRedirectHandler(profileRequiredPayload);
      return Promise.reject(error);
    }

    if (
      status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isTokenEndpoint(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const accessToken = await refreshAccessToken();
      setAuthorizationHeader(originalRequest, accessToken);
      return await apiClient.request(originalRequest);
    } catch (refreshError: unknown) {
      clearStoredAuthTokens();
      return Promise.reject(
        refreshError instanceof Error
          ? refreshError
          : new AxiosError("Token refresh failed")
      );
    }
  }
);

export async function getData<T>(
  url: string,
  config?: AxiosRequestConfig<unknown>
): Promise<T> {
  const response = await apiClient.get<T, AxiosResponse<T>, unknown>(
    url,
    config
  );

  return response.data;
}

export async function postData<T, D>(
  url: string,
  data: D,
  config?: AxiosRequestConfig<D>
): Promise<T> {
  const response = await apiClient.post<T, AxiosResponse<T>, D>(
    url,
    data,
    config
  );

  return response.data;
}

export async function patchData<T, D>(
  url: string,
  data: D,
  config?: AxiosRequestConfig<D>
): Promise<T> {
  const response = await apiClient.patch<T, AxiosResponse<T>, D>(
    url,
    data,
    config
  );

  return response.data;
}

export async function deleteData<T, D = unknown>(
  url: string,
  config?: AxiosRequestConfig<D>
): Promise<T> {
  const response = await apiClient.delete<T, AxiosResponse<T>, D>(url, config);

  return response.data;
}

export function getApiError(error: unknown): ApiErrorResponse {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const data = error.response?.data;

    if (data && typeof data === "object") {
      return data;
    }

    return { detail: error.message };
  }

  if (error instanceof Error) {
    return { detail: error.message };
  }

  return { detail: "Unknown API error" };
}

export function getApiErrorMessage(error: unknown): string {
  const apiError = getApiError(error);

  if (typeof apiError.detail === "string") {
    return apiError.detail;
  }

  if (typeof apiError.message === "string") {
    return apiError.message;
  }

  if (typeof apiError.error === "string") {
    return apiError.error;
  }

  return "API request failed";
}

function parseRetryAfter(value: unknown): number | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined;

  const text = String(value).trim();
  if (!text) return undefined;

  const seconds = Number(text);
  if (Number.isFinite(seconds)) {
    return Math.max(0, Math.ceil(seconds));
  }

  const retryDate = Date.parse(text);
  if (Number.isNaN(retryDate)) return undefined;

  return Math.max(0, Math.ceil((retryDate - Date.now()) / 1000));
}

function getHeaderValue(headers: unknown, name: string): unknown {
  if (headers instanceof AxiosHeaders) {
    return headers.get(name);
  }

  if (!isRecord(headers)) return undefined;

  return headers[name] ?? headers[name.toLowerCase()];
}

export function toApiRequestError(error: unknown): ApiRequestError {
  const data = getApiError(error);
  const message = getApiErrorMessage(error);

  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const retryAfter = getHeaderValue(error.response?.headers, "retry-after");

    return new ApiRequestError(
      message,
      data,
      error.response?.status,
      parseRetryAfter(retryAfter)
    );
  }

  return new ApiRequestError(message, data);
}

export function throwApiRequestError(error: unknown): never {
  throw toApiRequestError(error);
}

export function throwApiError(error: unknown): never {
  throw new Error(getApiErrorMessage(error));
}
