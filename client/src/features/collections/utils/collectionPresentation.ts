import type { Book } from "../../catalog/types/book";
import type {
  CollectionBook,
  CollectionPrivacy,
  ReadingCollection,
  ReadingCollectionStatus,
} from "../types/collection";

export type CollectionTypeFilter = ReadingCollectionStatus | "all";
export type CollectionPrivacyFilter = CollectionPrivacy | "all";
export type CollectionSortOption = "recent" | "name" | "books";

export interface CollectionOption<TValue extends string> {
  value: TValue;
  label: string;
}

export const collectionTypeOptions = [
  { value: "todo", label: "Plan to read" },
  { value: "doing", label: "Reading now" },
  { value: "done", label: "Finished" },
  { value: "custom", label: "Custom" },
] as const satisfies readonly CollectionOption<ReadingCollectionStatus>[];

export const collectionTypeFilterOptions = [
  { value: "all", label: "All" },
  ...collectionTypeOptions,
] as const satisfies readonly CollectionOption<CollectionTypeFilter>[];

export const collectionPrivacyOptions = [
  { value: "private", label: "Private" },
  { value: "public", label: "Public" },
] as const satisfies readonly CollectionOption<CollectionPrivacy>[];

export const collectionPrivacyFilterOptions = [
  { value: "all", label: "Any privacy" },
  ...collectionPrivacyOptions,
] as const satisfies readonly CollectionOption<CollectionPrivacyFilter>[];

export const collectionSortOptions = [
  { value: "recent", label: "Recently updated" },
  { value: "name", label: "Name" },
  { value: "books", label: "Book count" },
] as const satisfies readonly CollectionOption<CollectionSortOption>[];

export const collectionTypeToneClasses: Record<ReadingCollectionStatus, string> = {
  todo: "border-info/30 bg-info/10 text-info",
  doing: "border-warning/30 bg-warning/10 text-warning",
  done: "border-success/30 bg-success/10 text-success",
  custom: "border-accent/30 bg-accent/10 text-accent",
};

export const collectionPrivacyToneClasses: Record<CollectionPrivacy, string> = {
  private: "border-warning/30 bg-warning/10 text-warning",
  public: "border-success/30 bg-success/10 text-success",
};

export interface CollectionStats {
  totalCollections: number;
  totalBooks: number;
  activeCollections: number;
  finishedCollections: number;
  publicCollections: number;
}

export function collectionTypeLabel(type?: ReadingCollectionStatus): string {
  return (
    collectionTypeOptions.find((option) => option.value === type)?.label ??
    "Custom"
  );
}

export function collectionPrivacyLabel(privacy?: CollectionPrivacy): string {
  return (
    collectionPrivacyOptions.find((option) => option.value === privacy)?.label ??
    "Private"
  );
}

export function getCollectionBookCount(collection: ReadingCollection): number {
  if (typeof collection.item_count === "number") return collection.item_count;

  return (collection.items ?? []).filter((item) => !item.is_archived).length;
}

export function getCollectionPreviewBooks(
  collection: ReadingCollection,
  limit = 4
): Book[] {
  return (collection.items ?? [])
    .filter((item): item is CollectionBook & { book_detail: Book } =>
      Boolean(item.book_detail) && !item.is_archived
    )
    .map((item) => item.book_detail)
    .slice(0, limit);
}

export function getCollectionStats(
  collections: readonly ReadingCollection[]
): CollectionStats {
  return collections.reduce<CollectionStats>(
    (stats, collection) => {
      const bookCount = getCollectionBookCount(collection);
      const type = collection.list_type ?? "custom";
      const privacy = collection.privacy ?? "private";

      return {
        totalCollections: stats.totalCollections + 1,
        totalBooks: stats.totalBooks + bookCount,
        activeCollections:
          stats.activeCollections + (type === "doing" ? 1 : 0),
        finishedCollections:
          stats.finishedCollections + (type === "done" ? 1 : 0),
        publicCollections:
          stats.publicCollections + (privacy === "public" ? 1 : 0),
      };
    },
    {
      totalCollections: 0,
      totalBooks: 0,
      activeCollections: 0,
      finishedCollections: 0,
      publicCollections: 0,
    }
  );
}

export function formatBookCount(count: number): string {
  return `${count.toLocaleString()} ${count === 1 ? "book" : "books"}`;
}

export function formatCollectionDate(value?: string | null): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function getCollectionTimestamp(collection: ReadingCollection): number {
  const value =
    collection.last_book_added_at ?? collection.updated_at ?? collection.created_at;
  if (!value) return collection.id;

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? collection.id : timestamp;
}
