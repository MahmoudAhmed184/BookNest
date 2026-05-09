import {
  authHeaders,
  deleteData,
  getData,
  patchData,
  postData,
  throwApiError,
} from "../../../lib/axios";
import {
  normalizeEmptyResponse,
  normalizeListResponse,
  normalizePaginatedList,
} from "../../../lib/normalizers";
import type {
  LimitOffsetApiResponse,
  OffsetPageParams,
} from "../../../types/api";
import type {
  AddToCollectionPayload,
  CollectionBook,
  CreateCollectionPayload,
  ReadingCollection,
  ReadingProgress,
  UpdateCollectionPayload,
  UpdateReadingProgressPayload,
} from "../types/collection";

export async function getCollections(
  tokenOverride?: string | null
): Promise<ReadingCollection[]> {
  try {
    const response = await getData<
      LimitOffsetApiResponse<ReadingCollection> | ReadingCollection[]
    >(
      "/api/v1/reading-collections/?mine=true&page_size=100",
      { headers: authHeaders(tokenOverride) }
    );
    return normalizeListResponse(response);
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getCollection(
  collectionId: number | string | undefined,
  token?: string | null
): Promise<ReadingCollection> {
  try {
    return await getData<ReadingCollection>(
      `/api/v1/reading-collections/${collectionId}/`,
      { headers: authHeaders(token) }
    );
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function createCollection(
  data: CreateCollectionPayload,
  token?: string | null
): Promise<ReadingCollection> {
  try {
    return await postData<ReadingCollection, CreateCollectionPayload>(
      "/api/v1/reading-collections/",
      data,
      { headers: authHeaders(token) }
    );
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function updateCollection(
  collectionId: number | string,
  data: UpdateCollectionPayload,
  token?: string | null
): Promise<ReadingCollection> {
  try {
    return await patchData<ReadingCollection, UpdateCollectionPayload>(
      `/api/v1/reading-collections/${collectionId}/`,
      data,
      { headers: authHeaders(token) }
    );
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function deleteCollection(
  collectionId: number | string,
  token?: string | null
): Promise<void> {
  try {
    await deleteData<void>(`/api/v1/reading-collections/${collectionId}/`, {
      headers: authHeaders(token),
    });
    return normalizeEmptyResponse();
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function addToCollection(
  data: AddToCollectionPayload,
  token?: string | null
): Promise<CollectionBook> {
  try {
    return await postData<CollectionBook, AddToCollectionPayload>(
      "/api/v1/collection-books/",
      data,
      { headers: authHeaders(token) }
    );
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getCollectionBooks(
  token?: string | null
): Promise<CollectionBook[]> {
  try {
    const response = await getData<
      LimitOffsetApiResponse<CollectionBook> | CollectionBook[]
    >("/api/v1/collection-books/?page_size=200", {
      headers: authHeaders(token),
    });
    return normalizeListResponse(response);
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function removeFromCollection(
  collectionBookId: number,
  token?: string | null
): Promise<void> {
  try {
    await deleteData<void>(`/api/v1/collection-books/${collectionBookId}/`, {
      headers: authHeaders(token),
    });
    return normalizeEmptyResponse();
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function saveReadingProgress(
  data: UpdateReadingProgressPayload,
  token?: string | null
): Promise<ReadingProgress> {
  try {
    return await postData<ReadingProgress, UpdateReadingProgressPayload>(
      "/api/v1/reading-progress/",
      data,
      { headers: authHeaders(token) }
    );
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getUserCollections(
  id: number | string | undefined,
  token?: string | null
): Promise<ReadingCollection[]> {
  const params: OffsetPageParams = {
    page: 1,
    pageSize: 20,
  };

  try {
    const collections = await getData<
      LimitOffsetApiResponse<ReadingCollection> | ReadingCollection[]
    >(
      `/api/v1/users/${id}/reading-collections/?page=1&page_size=20`,
      { headers: authHeaders(token) }
    );
    return normalizePaginatedList(collections, params).results;
  } catch (error: unknown) {
    throwApiError(error);
  }
}
