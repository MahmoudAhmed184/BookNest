import {
  authHeaders,
  deleteData,
  getApiError,
  getData,
  patchData,
  throwApiError,
} from "./apiClient";
import type {
  ProfileResponseEnvelope,
  UpdateBioPayload,
  UpdateUserPayload,
  UserProfile,
  UserRatingsResponse,
  UserReviewsResponse,
} from "../types/user";

export async function getMyProfile(): Promise<UserProfile> {
  try {
    const response = await getData<ProfileResponseEnvelope>(
      "/api/users/profile/me/",
      {
        headers: authHeaders(),
      }
    );
    console.log(response.data.profile);

    return response.data.profile;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getProfile(
  id: string | undefined
): Promise<UserProfile> {
  try {
    const response = await getData<ProfileResponseEnvelope>(
      `/api/users/profile/${id}/`,
      {
        headers: authHeaders(),
      }
    );
    console.log(response.data.profile);

    return response.data.profile;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getUserProfile(
  id: number | string | undefined
): Promise<ProfileResponseEnvelope> {
  const token = localStorage.getItem("token");
  console.log(token);

  try {
    const response = await getData<ProfileResponseEnvelope>(
      `/api/users/profile/${id}/`,
      {
        headers: authHeaders(token),
      }
    );
    console.log(response);
    return response;
  } catch (error: unknown) {
    const apiError = getApiError(error);
    console.log(apiError);
    throwApiError(error);
  }
}

export async function updateUser(
  token: string | null,
  data: UpdateUserPayload
): Promise<UserProfile> {
  console.log(token);

  try {
    const response = await patchData<UserProfile, UpdateUserPayload>(
      "/api/users/user/",
      data,
      {
        headers: authHeaders(token),
      }
    );
    console.log(response);
    return response;
  } catch (error: unknown) {
    const apiError = getApiError(error);
    console.log(apiError);
    throwApiError(error);
  }
}

export async function updateBio(
  data: UpdateBioPayload
): Promise<UserProfile> {
  try {
    const response = await patchData<UserProfile, UpdateBioPayload>(
      "/api/users/profile/me/",
      data,
      {
        headers: authHeaders(),
      }
    );
    console.log(response);
    return response;
  } catch (error: unknown) {
    const apiError = getApiError(error);
    console.log(apiError);
    throwApiError(error);
  }
}

export async function getUserReviews(
  id: number | string | undefined
): Promise<UserReviewsResponse> {
  try {
    const response = await getData<UserReviewsResponse>(
      `/api/books/users/${id}/reviews/`,
      {
        headers: authHeaders(),
      }
    );
    console.log(response);
    return response;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getUserRatings(
  id: number | string | undefined
): Promise<UserRatingsResponse> {
  try {
    const response = await getData<UserRatingsResponse>(
      `/api/books/users/${id}/ratings/`,
      {
        headers: authHeaders(),
      }
    );
    console.log(response);
    return response;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function deleteReview(
  id: number | string | undefined
): Promise<{ detail?: string }> {
  try {
    const response = await deleteData<{ detail?: string }>(
      `/api/books/reviews/${id}/delete/`,
      {
        headers: authHeaders(),
      }
    );
    console.log("Response:", response);
    return response;
  } catch (error: unknown) {
    console.error("Error response:", getApiError(error));
    throw error;
  }
}
