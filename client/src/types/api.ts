export interface ApiErrorResponse {
  detail?: string;
  message?: string;
  error?: string;
  non_field_errors?: string[];
  [key: string]: unknown;
}

export interface ApiDetailResponse {
  detail?: string;
}

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

export interface CursorApiResponse<T> {
  next: string | null;
  previous: string | null;
  results: T[];
}
