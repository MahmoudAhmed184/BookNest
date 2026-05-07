import type { Book } from "../../catalog/types/book";

export interface ReadingList {
  list_id: number;
  id?: number;
  name: string;
  type?: string;
  privacy?: string;
  created_at?: string;
  book_count?: number;
  owner_username?: string | null;
  books?: Book[];
}

export interface CreateCollectionPayload {
  name: string;
  type?: string;
  privacy?: string;
}

export type UpdateCollectionPayload = Partial<CreateCollectionPayload>;

export interface AddToCollectionPayload {
  book_id: string | undefined;
  list_id: number | null;
}

export interface AddToCollectionResponse {
  message: string;
}
