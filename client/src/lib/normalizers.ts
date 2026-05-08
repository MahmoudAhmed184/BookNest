import type {
  LimitOffsetApiResponse,
  OffsetPageParams,
  OffsetPaginatedResponse,
} from "../types/api";

export interface AuthEnvelopeMeta {
  profile_required?: boolean;
  next_action?: string;
  action_required?: string;
  profile_creation_url?: string;
  [key: string]: unknown;
}

export interface AuthEnvelopeData<TUser> {
  user: TUser;
  access: string;
  refresh: string;
}

export interface AuthEnvelope<TUser, TMeta extends AuthEnvelopeMeta = AuthEnvelopeMeta> {
  success?: boolean;
  message?: string;
  data: AuthEnvelopeData<TUser>;
  meta?: TMeta;
}

export interface NormalizedAuthEnvelope<
  TUser,
  TMeta extends AuthEnvelopeMeta = AuthEnvelopeMeta,
> {
  user: TUser;
  access: string;
  refresh: string;
  meta?: TMeta;
}

export interface ProfileEnvelope<TProfile> {
  success?: boolean;
  message?: string;
  data: {
    profile: TProfile;
  };
}

export interface NormalizedProfileEnvelope<TProfile> {
  profile: TProfile;
}

export interface NormalizedLimitOffsetList<TItem> {
  count: number;
  next: string | null;
  previous: string | null;
  results: TItem[];
}

export function normalizeAuthEnvelope<
  TUser,
  TMeta extends AuthEnvelopeMeta = AuthEnvelopeMeta,
>(
  envelope: AuthEnvelope<TUser, TMeta>
): NormalizedAuthEnvelope<TUser, TMeta> {
  const normalized = {
    user: envelope.data.user,
    access: envelope.data.access,
    refresh: envelope.data.refresh,
  };

  if (envelope.meta === undefined) {
    return normalized;
  }

  return {
    ...normalized,
    meta: envelope.meta,
  };
}

export function normalizeProfileEnvelope<TProfile>(
  envelope: ProfileEnvelope<TProfile>
): NormalizedProfileEnvelope<TProfile> {
  return {
    profile: envelope.data.profile,
  };
}

export function normalizeLimitOffsetList<TItem>(
  response: LimitOffsetApiResponse<TItem>
): NormalizedLimitOffsetList<TItem> {
  return {
    count: response.count ?? response.results.length,
    next: response.next ?? null,
    previous: response.previous ?? null,
    results: response.results,
  };
}

export function normalizePaginatedList<TItem>(
  response: LimitOffsetApiResponse<TItem> | TItem[],
  params: OffsetPageParams
): OffsetPaginatedResponse<TItem> {
  const results = Array.isArray(response) ? response : response.results;
  const count = Array.isArray(response) ? results.length : response.count ?? results.length;
  const totalPages = count > 0 ? Math.ceil(count / params.pageSize) : 0;

  return {
    count,
    next: Array.isArray(response) ? null : response.next ?? null,
    previous: Array.isArray(response) ? null : response.previous ?? null,
    results,
    page: params.page,
    pageSize: params.pageSize,
    totalPages,
    hasNext: params.page < totalPages,
    hasPrevious: params.page > 1,
  };
}

export function normalizeArrayResponse<TItem>(response: TItem[]): TItem[] {
  return response;
}

export function normalizeEmptyResponse(): void {
  return undefined;
}
