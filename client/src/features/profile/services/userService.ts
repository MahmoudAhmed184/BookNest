import {
  authHeaders,
  deleteData,
  getData,
  patchData,
  postData,
  throwApiError,
} from "../../../lib/axios";
import type { ApiDetailResponse } from "../../../types/api";
import type {
  ProfileResponseEnvelope,
  UpdateBioPayload,
  UpdateUserPayload,
  UploadProfilePictureResponse,
  UserProfile,
  UserRatingsResponse,
  UserReviewsResponse,
} from "../types/user";

export async function getMyProfile(token?: string | null): Promise<UserProfile> {
  try {
    const response = await getData<ProfileResponseEnvelope>(
      "/api/users/profile/me/",
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
      `/api/users/profile/${id}/`,
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
      `/api/users/profile/${id}/`,
      {
        headers: authHeaders(token),
      }
    );
    return response;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function updateUser(
  token: string | null | undefined,
  data: UpdateUserPayload
): Promise<UserProfile> {
  try {
    const response = await patchData<UserProfile, UpdateUserPayload>(
      "/api/users/user/",
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
): Promise<UserProfile> {
  try {
    const response = await patchData<UserProfile, UpdateBioPayload>(
      "/api/users/profile/me/",
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

export async function uploadProfilePicture(
  file: File,
  tokenOverride?: string | null
): Promise<UploadProfilePictureResponse> {
  const formData = new FormData();
  formData.append("profile_pic", file);

  try {
    const response = await postData<UploadProfilePictureResponse, FormData>(
      "/api/users/profile/upload_picture/",
      formData,
      {
        headers: authHeaders(tokenOverride),
      }
    );
    return response;
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
      `/api/books/users/${id}/reviews/`,
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
      `/api/books/users/${id}/ratings/`,
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
      `/api/books/reviews/${id}/delete/`,
      {
        headers: authHeaders(token),
      }
    );
    return response;
  } catch (error: unknown) {
    throwApiError(error);
  }
}
