import {
  authHeaders,
  deleteData,
  getData,
  postData,
  throwApiError,
} from "../../../lib/axios";
import {
  normalizeEmptyResponse,
  normalizePaginatedList,
} from "../../../lib/normalizers";
import type {
  LimitOffsetApiResponse,
  OffsetPageParams,
} from "../../../types/api";
import type {
  FollowRelationship,
  FollowRelationshipPage,
} from "../types/follow";

const defaultFollowPage: OffsetPageParams = {
  page: 1,
  pageSize: 20,
};

function buildQuery(params: Record<string, string | undefined>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.set(key, value);
  });

  return searchParams.size > 0 ? `?${searchParams.toString()}` : "";
}

async function getFollowPage(
  url: string,
  params: OffsetPageParams,
  token?: string | null
): Promise<FollowRelationshipPage> {
  const rows = await getData<
    LimitOffsetApiResponse<FollowRelationship> | FollowRelationship[]
  >(url, {
    headers: authHeaders(token),
  });
  return normalizePaginatedList(rows, params);
}

export async function listFollows(
  token?: string | null,
  following?: string | number
): Promise<FollowRelationship[]> {
  try {
    const query = buildQuery({
      page: "1",
      page_size: "100",
      following: following === undefined ? undefined : String(following),
    });
    const page = await getFollowPage(
      `/api/v1/follows/${query}`,
      { page: 1, pageSize: 100 },
      token
    );
    return page.results;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function followUser(
  userId: number,
  token?: string | null
): Promise<FollowRelationship> {
  try {
    return await postData<FollowRelationship, { following: number }>(
      "/api/v1/follows/",
      { following: userId },
      { headers: authHeaders(token) }
    );
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function unfollowById(
  followId: number,
  token?: string | null
): Promise<void> {
  try {
    await deleteData<void>(`/api/v1/follows/${followId}/`, {
      headers: authHeaders(token),
    });
    return normalizeEmptyResponse();
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getMyFollowers(
  token?: string | null
): Promise<FollowRelationship[]> {
  try {
    const page = await getFollowPage(
      "/api/v1/followers/?page=1&page_size=100",
      { page: 1, pageSize: 100 },
      token
    );
    return page.results;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getMyFollowing(
  token?: string | null
): Promise<FollowRelationship[]> {
  return listFollows(token);
}

export async function getProfileFollowers(
  userId: string | number | undefined,
  params: OffsetPageParams = defaultFollowPage,
  token?: string | null
): Promise<FollowRelationshipPage> {
  const query = buildQuery({
    page: String(params.page),
    page_size: String(params.pageSize),
  });

  try {
    return await getFollowPage(
      `/api/v1/users/${userId}/followers/${query}`,
      params,
      token
    );
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getProfileFollowing(
  userId: string | number | undefined,
  params: OffsetPageParams = defaultFollowPage,
  token?: string | null
): Promise<FollowRelationshipPage> {
  const query = buildQuery({
    page: String(params.page),
    page_size: String(params.pageSize),
  });

  try {
    return await getFollowPage(
      `/api/v1/users/${userId}/following/${query}`,
      params,
      token
    );
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getFollowStatus(
  userId: string | number | undefined,
  token?: string | null
): Promise<FollowRelationship | null> {
  if (!userId || !token) return null;

  const follows = await listFollows(token, userId);
  return follows[0] ?? null;
}
