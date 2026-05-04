import type { Book } from "./book";

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

export interface AddToCollectionPayload {
  book_id: string | undefined;
  list_id: number | null;
}
