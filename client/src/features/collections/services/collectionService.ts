import {
  authHeaders,
  getApiError,
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
  const token = tokenOverride ?? localStorage.getItem("token");
  console.log(token);

  try {
    const response = await getData<ReadingList[]>(
      "/api/books/reading-lists/",
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

export async function createCollection(
  data: CreateCollectionPayload
): Promise<ReadingList> {
  const token = localStorage.getItem("token");
  console.log(token);
  console.log(data);

  try {
    const response = await postData<ReadingList, CreateCollectionPayload>(
      "/api/books/reading-lists/create/",
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

export async function addToCollection(
  data: AddToCollectionPayload
): Promise<ReadingList> {
  console.log(data);

  try {
    const response = await postData<ReadingList, AddToCollectionPayload>(
      "/api/books/reading-lists/books/",
      data,
      {
        headers: authHeaders(),
      }
    );
    return response;
  } catch (error: unknown) {
    console.log(error);

    throwApiError(error);
  }
}

export async function getUserCollections(
  id: number | string | undefined
): Promise<ReadingList[]> {
  const token = localStorage.getItem("token");
  console.log(token);

  try {
    const response = await getData<ReadingList[]>(
      `/api/books/users/${id}/reading-lists/`,
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
