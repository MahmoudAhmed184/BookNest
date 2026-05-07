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

export interface ApiDetailResponse {
  detail?: string;
}

export type ApiResult<T> = T | ApiErrorResponse;

export interface OffsetPageParams {
  page: number;
  pageSize: number;
}

export interface OffsetPaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface LimitOffsetApiResponse<T> {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
}

export interface PageNumberPaginationApiMeta {
  current_page?: number;
  page_size?: number;
  total_count?: number;
  total_pages?: number;
  has_next?: boolean;
  has_previous?: boolean;
}

export interface PageNumberApiResponse<T> {
  query?: string;
  results: T[];
  pagination?: PageNumberPaginationApiMeta;
  filters_applied?: Record<string, unknown>;
  include_external?: boolean;
}

export interface CursorPageParams {
  pageSize: number;
  cursor?: string;
}

export interface CursorApiResponse<T> {
  next: string | null;
  previous: string | null;
  results: T[];
}
