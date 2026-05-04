import axios, { type AxiosRequestConfig, type AxiosResponse } from "axios";
import { API_BASE_URL } from "../config";
import type { ApiErrorResponse } from "../types/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export function authHeaders(
  token: string | null = localStorage.getItem("token")
): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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
