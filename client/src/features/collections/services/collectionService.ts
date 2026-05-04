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
      "/api/books/reading-lists/",
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
      "/api/books/reading-lists/create/",
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
    const response = await postData<ReadingList, AddToCollectionPayload>(
      "/api/books/reading-lists/books/",
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

export async function getUserCollections(
  id: number | string | undefined,
  token?: string | null
): Promise<ReadingList[]> {
  try {
    const response = await getData<ReadingList[]>(
      `/api/books/users/${id}/reading-lists/`,
      {
        headers: authHeaders(token),
      }
    );
    return response;
  } catch (error: unknown) {
    throwApiError(error);
  }
}
