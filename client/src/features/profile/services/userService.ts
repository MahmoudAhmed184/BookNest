import {
  authHeaders,
  deleteData,
  getData,
  patchData,
  postData,
  throwApiError,
} from "../../../lib/axios";
import { normalizeProfileEnvelope, type ProfileEnvelope } from "../../../lib/normalizers";
import type { ApiDetailResponse, ApiEnvelope } from "../../../types/api";
import type {
  Profile,
  ProfileResponseEnvelope,
  UpdateBioPayload,
  UpdateUserPayload,
  UploadProfilePictureResponse,
  User,
  UserDataAggregate,
  UserDataAggregateEnvelope,
  UserProfile,
  UserRatingsResponse,
  UserReviewsResponse,
} from "../types/user";

export async function getMyProfile(token?: string | null): Promise<UserProfile> {
  try {
    const response = await getData<ProfileResponseEnvelope>(
      "/api/v1/profiles/me/",
      {
        headers: authHeaders(token),
      }
    );

    return response.data.profile;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getProfile(
  id: string | undefined,
  token?: string | null
): Promise<UserProfile> {
  try {
    const response = await getData<ProfileResponseEnvelope>(
      `/api/v1/profiles/${id}/`,
      {
        headers: authHeaders(token),
      }
    );

    return response.data.profile;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getUserProfile(
  id: number | string | undefined,
  token?: string | null
): Promise<ProfileResponseEnvelope> {
  try {
    const response = await getData<ProfileResponseEnvelope>(
      `/api/v1/profiles/${id}/`,
      {
        headers: authHeaders(token),
      }
    );
    return response;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getUserDataAggregate(
  id: number | string | undefined,
  token?: string | null
): Promise<UserDataAggregate> {
  try {
    const response = await getData<UserDataAggregateEnvelope>(
      `/api/v1/users/${id}/data/`,
      {
        headers: authHeaders(token),
      }
    );
    return response.data;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function updateUser(
  token: string | null | undefined,
  data: UpdateUserPayload
): Promise<User> {
  try {
    const response = await patchData<User, UpdateUserPayload>(
      "/api/v1/users/me/",
      data,
      {
        headers: authHeaders(token),
      }
    );
    return response;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function updateBio(
  data: UpdateBioPayload,
  token?: string | null
): Promise<Profile> {
  try {
    const response = await patchData<ProfileEnvelope<Profile>, UpdateBioPayload>(
      "/api/v1/profiles/me/",
      data,
      {
        headers: authHeaders(token),
      }
    );

    return normalizeProfileEnvelope(response).profile;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function uploadProfilePicture(
  file: File,
  tokenOverride?: string | null
): Promise<UploadProfilePictureResponse> {
  const formData = new FormData();
  formData.append("profile_pic", file);

  try {
    const response = await postData<ApiEnvelope<UploadProfilePictureResponse>, FormData>(
      "/api/v1/profiles/me/picture/",
      formData,
      {
        headers: authHeaders(tokenOverride),
      }
    );
    return response.data;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getUserReviews(
  id: number | string | undefined,
  token?: string | null
): Promise<UserReviewsResponse> {
  try {
    const response = await getData<UserReviewsResponse>(
      `/api/v1/users/${id}/reviews/`,
      {
        headers: authHeaders(token),
      }
    );
    return response;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getUserRatings(
  id: number | string | undefined,
  token?: string | null
): Promise<UserRatingsResponse> {
  try {
    const response = await getData<UserRatingsResponse>(
      `/api/v1/users/${id}/ratings/`,
      {
        headers: authHeaders(token),
      }
    );
    return response;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function deleteReview(
  id: number | string | undefined,
  token?: string | null
): Promise<ApiDetailResponse> {
  try {
    const response = await deleteData<ApiDetailResponse>(
      `/api/v1/reviews/${id}/`,
      {
        headers: authHeaders(token),
      }
    );
    return response;
  } catch (error: unknown) {
    throwApiError(error);
  }
}
