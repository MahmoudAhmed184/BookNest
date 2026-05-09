import type { ReactElement } from "react";

import type {
  ReadingCollection,
  UpdateCollectionPayload,
} from "../../types/collection";
import { CollectionCard } from "./CollectionCard";

interface CollectionGridProps {
  collections: ReadingCollection[];
  isSaving: boolean;
  isDeleting: boolean;
  onUpdate: (
    collectionId: number,
    payload: UpdateCollectionPayload
  ) => Promise<ReadingCollection>;
  onDelete: (collectionId: number) => Promise<void>;
}

export function CollectionGrid({
  collections,
  isSaving,
  isDeleting,
  onUpdate,
  onDelete,
}: CollectionGridProps): ReactElement {
  return (
    <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
      {collections.map((collection) => (
        <CollectionCard
          key={collection.id}
          collection={collection}
          isSaving={isSaving}
          isDeleting={isDeleting}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
