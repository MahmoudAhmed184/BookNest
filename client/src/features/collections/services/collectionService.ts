import {
  authHeaders,
  deleteData,
  getData,
  patchData,
  postData,
  throwApiError,
} from "../../../lib/axios";
import {
  normalizeArrayResponse,
  normalizeEmptyResponse,
} from "../../../lib/normalizers";
import type {
  AddToCollectionPayload,
  AddToCollectionResponse,
  CreateCollectionPayload,
  ReadingList,
  UpdateCollectionPayload,
} from "../types/collection";

export async function getCollections(
  tokenOverride?: string | null
): Promise<ReadingList[]> {
  try {
    const response = await getData<ReadingList[]>(
      "/api/v1/reading-lists/",
      {
        headers: authHeaders(tokenOverride),
      }
    );
    return normalizeArrayResponse(response);
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getCollection(
  listId: number | string | undefined,
  token?: string | null
): Promise<ReadingList> {
  try {
    const response = await getData<ReadingList>(
      `/api/v1/reading-lists/${listId}/`,
      {
        headers: authHeaders(token),
      }
    );
    return response;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function createCollection(
  data: CreateCollectionPayload,
  token?: string | null
): Promise<ReadingList> {
  try {
    const response = await postData<ReadingList, CreateCollectionPayload>(
      "/api/v1/reading-lists/",
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

export async function updateCollection(
  listId: number | string,
  data: UpdateCollectionPayload,
  token?: string | null
): Promise<ReadingList> {
  try {
    const response = await patchData<ReadingList, UpdateCollectionPayload>(
      `/api/v1/reading-lists/${listId}/`,
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

export async function deleteCollection(
  listId: number | string,
  token?: string | null
): Promise<void> {
  try {
    await deleteData<void>(`/api/v1/reading-lists/${listId}/`, {
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
): Promise<AddToCollectionResponse> {
  try {
    const response = await postData<AddToCollectionResponse, Record<string, never>>(
      `/api/v1/reading-lists/${data.list_id}/books/${data.book_id}/`,
      {},
      {
        headers: authHeaders(token),
      }
    );
    return response;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function removeFromCollection(
  data: AddToCollectionPayload,
  token?: string | null
): Promise<void> {
  try {
    await deleteData<void, AddToCollectionPayload>(
      `/api/v1/reading-lists/${data.list_id}/books/${data.book_id}/`,
      {
        headers: authHeaders(token),
        data,
      }
    );
    return normalizeEmptyResponse();
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getUserCollections(
  id: number | string | undefined,
  token?: string | null
): Promise<ReadingList[]> {
  try {
    const response = await getData<ReadingList[]>(
      `/api/v1/users/${id}/reading-lists/`,
      {
        headers: authHeaders(token),
      }
    );
    return normalizeArrayResponse(response);
  } catch (error: unknown) {
    throwApiError(error);
  }
}
