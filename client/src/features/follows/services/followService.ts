import {
  authHeaders,
  deleteData,
  getData,
  postData,
  throwApiError,
} from "../../../lib/axios";
import {
  normalizeArrayResponse,
  normalizeEmptyResponse,
} from "../../../lib/normalizers";
import type { Follow, FollowProfileRow } from "../types/follow";

export async function listFollows(token?: string | null): Promise<Follow[]> {
  try {
    const response = await getData<Follow[]>("/api/v1/follows/", {
      headers: authHeaders(token),
    });
    return normalizeArrayResponse(response);
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function followProfile(
  profileId: number,
  token?: string | null
): Promise<Follow> {
  try {
    const response = await postData<Follow, { followed: number }>(
      "/api/v1/follows/",
      { followed: profileId },
      {
        headers: authHeaders(token),
      }
    );
    return response;
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
): Promise<FollowProfileRow[]> {
  return getFollowRows("/api/v1/profiles/me/followers/", token);
}

export async function getMyFollowing(
  token?: string | null
): Promise<FollowProfileRow[]> {
  return getFollowRows("/api/v1/profiles/me/following/", token);
}

export async function getProfileFollowers(
  profileId: number | string | undefined,
  token?: string | null
): Promise<FollowProfileRow[]> {
  return getFollowRows(`/api/v1/profiles/${profileId}/followers/`, token);
}

export async function getProfileFollowing(
  profileId: number | string | undefined,
  token?: string | null
): Promise<FollowProfileRow[]> {
  return getFollowRows(`/api/v1/profiles/${profileId}/following/`, token);
}

async function getFollowRows(
  url: string,
  token?: string | null
): Promise<FollowProfileRow[]> {
  try {
    const response = await getData<FollowProfileRow[]>(url, {
      headers: authHeaders(token),
    });
    return normalizeArrayResponse(response);
  } catch (error: unknown) {
    throwApiError(error);
  }
}
