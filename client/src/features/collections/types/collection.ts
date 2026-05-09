import type { Book } from "../../catalog/types/book";

export type ReadingCollectionStatus = "todo" | "doing" | "done" | "custom";
export type CollectionPrivacy = "public" | "private";

export interface CollectionBook {
  id: number;
  collection: number;
  book: number;
  book_detail?: Book;
  added_by?: number | null;
  status: ReadingCollectionStatus;
  position: number;
  notes?: string;
  added_at?: string;
  started_at?: string | null;
  finished_at?: string | null;
  is_archived?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ReadingCollection {
  id: number;
  owner: number;
  name: string;
  slug?: string;
  description?: string;
  list_type: ReadingCollectionStatus;
  privacy: CollectionPrivacy;
  items?: CollectionBook[];
  is_default?: boolean;
  item_count?: number;
  last_book_added_at?: string | null;
  is_archived?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ReadingProgress {
  id: number;
  user: number;
  book: number;
  book_detail?: Book;
  status: ReadingCollectionStatus;
  current_page: number;
  percent_complete: number | string;
  started_at?: string | null;
  finished_at?: string | null;
  last_read_at?: string | null;
  marked_read_at?: string | null;
  is_archived?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCollectionPayload {
  name: string;
  description?: string;
  list_type?: ReadingCollectionStatus;
  privacy?: CollectionPrivacy;
}

export type UpdateCollectionPayload = Partial<CreateCollectionPayload>;

export interface AddToCollectionPayload {
  collection: number;
  book: number | undefined;
  status?: ReadingCollectionStatus;
  notes?: string;
}

export interface UpdateReadingProgressPayload {
  book: number;
  status: ReadingCollectionStatus;
  current_page?: number;
  percent_complete?: number;
  started_at?: string | null;
  finished_at?: string | null;
  last_read_at?: string | null;
  marked_read_at?: string | null;
}
