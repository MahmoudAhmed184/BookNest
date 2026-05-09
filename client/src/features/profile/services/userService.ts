import {
  authHeaders,
  deleteData,
  getData,
  patchData,
  postData,
  throwApiError,
} from "../../../lib/axios";
import { normalizePaginatedList } from "../../../lib/normalizers";
import type {
  ApiDetailResponse,
  LimitOffsetApiResponse,
  OffsetPageParams,
} from "../../../types/api";
import { isNumericRouteParam } from "../../../routes/paths";
import type { BookRating, BookReview } from "../../catalog/types/book";
import type {
  CreateProfileInterestPayload,
  CreateUserSocialLinkPayload,
  Profile,
  ProfileOverview,
  ProfileInterest,
  UpdateProfileInterestPayload,
  UpdateProfilePayload,
  UpdateUserPayload,
  UpdateUserSocialLinkPayload,
  UploadProfilePictureResponse,
  User,
  UserDataAggregate,
  UserPreference,
  UserRatingsPage,
  UserRatingsResponse,
  UserReviewsPage,
  UserReviewsResponse,
  UserSocialLink,
} from "../types/user";

const defaultUserActivityPage: OffsetPageParams = {
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

function apiPathSegment(value: number | string | undefined): string {
  return encodeURIComponent(String(value));
}

export async function getMyProfile(token?: string | null): Promise<Profile> {
  try {
    return await getData<Profile>("/api/v1/profiles/me/", {
      headers: authHeaders(token),
    });
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getProfile(
  id: string | undefined,
  token?: string | null
): Promise<Profile> {
  try {
    return await getData<Profile>(`/api/v1/profiles/${id}/`, {
      headers: authHeaders(token),
    });
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getUserDataAggregate(
  profileParam: number | string | undefined,
  token?: string | null
): Promise<UserDataAggregate> {
  try {
    const overview = await getProfileOverviewForProfileParam(profileParam, token);

    return {
      profile: overview.profile,
      viewer_context: overview.viewer_context,
      stats: overview.stats,
      reviews: overview.recent_reviews,
      ratings: overview.recent_ratings,
      reading_collections: overview.recent_collections,
    };
  } catch (error: unknown) {
    throwApiError(error);
  }
}

async function getUserProfileOverview(
  id: number | string | undefined,
  token?: string | null
): Promise<ProfileOverview> {
  try {
    return await getData<ProfileOverview>(
      `/api/v1/users/${apiPathSegment(id)}/profile-overview/`,
      { headers: authHeaders(token) }
    );
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getProfileOverviewByHandle(
  handle: number | string | undefined,
  token?: string | null
): Promise<ProfileOverview> {
  try {
    return await getData<ProfileOverview>(
      `/api/v1/profiles/by-handle/${apiPathSegment(handle)}/overview/`,
      { headers: authHeaders(token) }
    );
  } catch (error: unknown) {
    throwApiError(error);
  }
}

async function getProfileOverviewForProfileParam(
  profileParam: number | string | undefined,
  token?: string | null
): Promise<ProfileOverview> {
  if (isNumericRouteParam(profileParam)) {
    return getUserProfileOverview(profileParam, token);
  }

  return getProfileOverviewByHandle(profileParam, token);
}

export async function updateUser(
  token: string | null | undefined,
  data: UpdateUserPayload
): Promise<User> {
  try {
    return await patchData<User, UpdateUserPayload>("/api/v1/users/me/", data, {
      headers: authHeaders(token),
    });
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function updateBio(
  data: UpdateProfilePayload,
  token?: string | null
): Promise<Profile> {
  try {
    return await patchData<Profile, UpdateProfilePayload>(
      "/api/v1/profiles/me/",
      data,
      { headers: authHeaders(token) }
    );
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function uploadProfilePicture(
  file: File,
  tokenOverride?: string | null
): Promise<UploadProfilePictureResponse> {
  const formData = new FormData();
  formData.append("picture", file);

  try {
    return await postData<UploadProfilePictureResponse, FormData>(
      "/api/v1/profiles/me/picture/",
      formData,
      { headers: authHeaders(tokenOverride) }
    );
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getPreferences(
  token?: string | null
): Promise<UserPreference> {
  try {
    return await getData<UserPreference>("/api/v1/preferences/me/", {
      headers: authHeaders(token),
    });
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function updatePreferences(
  data: Partial<UserPreference>,
  token?: string | null
): Promise<UserPreference> {
  try {
    return await patchData<UserPreference, Partial<UserPreference>>(
      "/api/v1/preferences/me/",
      data,
      { headers: authHeaders(token) }
    );
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function createProfileInterest(
  data: CreateProfileInterestPayload,
  token?: string | null
): Promise<ProfileInterest> {
  try {
    return await postData<ProfileInterest, CreateProfileInterestPayload>(
      "/api/v1/profiles/me/interests/",
      data,
      { headers: authHeaders(token) }
    );
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function updateProfileInterest(
  id: number,
  data: UpdateProfileInterestPayload,
  token?: string | null
): Promise<ProfileInterest> {
  try {
    return await patchData<ProfileInterest, UpdateProfileInterestPayload>(
      `/api/v1/profiles/me/interests/${id}/`,
      data,
      { headers: authHeaders(token) }
    );
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function deleteProfileInterest(
  id: number,
  token?: string | null
): Promise<void> {
  try {
    await deleteData<void>(`/api/v1/profiles/me/interests/${id}/`, {
      headers: authHeaders(token),
    });
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function createUserSocialLink(
  data: CreateUserSocialLinkPayload,
  token?: string | null
): Promise<UserSocialLink> {
  try {
    return await postData<UserSocialLink, CreateUserSocialLinkPayload>(
      "/api/v1/profiles/me/social-links/",
      data,
      { headers: authHeaders(token) }
    );
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function updateUserSocialLink(
  id: number,
  data: UpdateUserSocialLinkPayload,
  token?: string | null
): Promise<UserSocialLink> {
  try {
    return await patchData<UserSocialLink, UpdateUserSocialLinkPayload>(
      `/api/v1/profiles/me/social-links/${id}/`,
      data,
      { headers: authHeaders(token) }
    );
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function deleteUserSocialLink(
  id: number,
  token?: string | null
): Promise<void> {
  try {
    await deleteData<void>(`/api/v1/profiles/me/social-links/${id}/`, {
      headers: authHeaders(token),
    });
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getUserReviews(
  id: number | string | undefined,
  token?: string | null
): Promise<UserReviewsResponse> {
  const response = await getUserReviewsPage(id, defaultUserActivityPage, token);
  return response.results;
}

async function getUserReviewsPage(
  id: number | string | undefined,
  params: OffsetPageParams = defaultUserActivityPage,
  token?: string | null
): Promise<UserReviewsPage> {
  const query = buildQuery({
    page: String(params.page),
    page_size: String(params.pageSize),
  });

  try {
    const reviews = await getData<
      LimitOffsetApiResponse<BookReview> | BookReview[]
    >(
      `/api/v1/users/${id}/reviews/${query}`,
      { headers: authHeaders(token) }
    );
    return normalizePaginatedList(reviews, params);
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getUserRatings(
  id: number | string | undefined,
  token?: string | null
): Promise<UserRatingsResponse> {
  const response = await getUserRatingsPage(id, defaultUserActivityPage, token);
  return response.results;
}

async function getUserRatingsPage(
  id: number | string | undefined,
  params: OffsetPageParams = defaultUserActivityPage,
  token?: string | null
): Promise<UserRatingsPage> {
  const query = buildQuery({
    page: String(params.page),
    page_size: String(params.pageSize),
  });

  try {
    const ratings = await getData<
      LimitOffsetApiResponse<BookRating> | BookRating[]
    >(
      `/api/v1/users/${id}/ratings/${query}`,
      { headers: authHeaders(token) }
    );
    return normalizePaginatedList(ratings, params);
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function deleteReview(
  id: number | string | undefined,
  token?: string | null
): Promise<ApiDetailResponse> {
  try {
    return await deleteData<ApiDetailResponse>(`/api/v1/reviews/${id}/`, {
      headers: authHeaders(token),
    });
  } catch (error: unknown) {
    throwApiError(error);
  }
}
