export interface ApiErrorResponse {
  detail?: string;
  message?: string;
  error?: string;
  non_field_errors?: string[];
  [key: string]: unknown;
}

export interface ApiEnvelope<T> {
  data: T;
  message?: string;
  status?: string;
}

export type ApiResult<T> = T | ApiErrorResponse;
