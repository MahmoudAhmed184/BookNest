import {
  authHeaders,
  getData,
  postData,
  throwApiError,
} from "../../../lib/axios";
import type {
  AddToCollectionPayload,
  CreateCollectionPayload,
  ReadingList,
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

export async function addToCollection(
  data: AddToCollectionPayload,
  token?: string | null
): Promise<ReadingList> {
  try {
    const response = await postData<ReadingList, Record<string, never>>(
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
    return response;
  } catch (error: unknown) {
    throwApiError(error);
  }
}
