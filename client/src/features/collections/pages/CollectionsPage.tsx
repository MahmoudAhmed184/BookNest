import {
  useState,
  type FormEvent,
  type ReactElement,
} from "react";
import { Link } from "react-router-dom";

import { EmptyState, ErrorState, InlineSpinner } from "../../../components/ui";
import { routeBuilders } from "../../../routes/paths";
import { useAuth } from "../../auth/hooks/useAuth";
import { useCollections } from "../hooks/useCollections";
import type {
  CollectionPrivacy,
  CreateCollectionPayload,
  ReadingCollection,
  ReadingCollectionStatus,
  UpdateCollectionPayload,
} from "../types/collection";

const typeOptions = ["todo", "doing", "done", "custom"] as const;
const privacyOptions = ["private", "public"] as const;

interface CollectionDraft {
  name: string;
  type: ReadingCollectionStatus;
  privacy: CollectionPrivacy;
}

const defaultDraft: CollectionDraft = {
  name: "",
  type: "custom",
  privacy: "private",
};

function collectionDraft(collection: ReadingCollection): CollectionDraft {
  return {
    name: collection.name,
    type: collection.list_type ?? "custom",
    privacy: collection.privacy ?? "private",
  };
}

export default function CollectionsPage(): ReactElement {
  const { token } = useAuth();
  const {
    collections,
    isLoading,
    isFetching,
    isError,
    isCreating,
    isUpdating,
    isDeleting,
    refetch,
    createCollection,
    updateCollection,
    deleteCollection,
  } = useCollections(token);
  const [draft, setDraft] = useState<CollectionDraft>(defaultDraft);

  const handleCreate = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    const name = draft.name.trim();
    if (!name) return;

    const payload: CreateCollectionPayload = {
      name,
      list_type: draft.type,
      privacy: draft.privacy,
    };
    await createCollection(payload);
    setDraft(defaultDraft);
  };

  if (isLoading) {
    return <CollectionsSkeleton />;
  }

  if (isError) {
    return (
      <div className="py-12">
        <ErrorState
          title="Collections could not be loaded"
          message="We could not load your reading collections right now."
          onRetry={refetch}
          isRetrying={isFetching}
        />
      </div>
    );
  }

  return (
    <div className="flex max-w-[1120px] flex-col gap-8 py-8 animate-fade-up lg:py-12">
      <header className="flex flex-col gap-3">
        <h1 className="text-4xl font-extrabold leading-tight text-primary-white md:text-5xl">
          Collections
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-primary-gray md:text-base">
          Manage your reading collections, shelf privacy, and collection type.
        </p>
      </header>

      <form
        onSubmit={handleCreate}
        className="glass-card grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_160px_160px_auto] md:items-end"
      >
        <TextField
          id="collection-name"
          label="Name"
          value={draft.name}
          onChange={(name) => setDraft((current) => ({ ...current, name }))}
          required
        />
        <SelectField
          id="collection-type"
          label="Type"
          value={draft.type}
          options={typeOptions}
          onChange={(type) => setDraft((current) => ({ ...current, type }))}
        />
        <SelectField
          id="collection-privacy"
          label="Privacy"
          value={draft.privacy}
          options={privacyOptions}
          onChange={(privacy) => setDraft((current) => ({ ...current, privacy }))}
        />
        <button
          type="submit"
          className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center gap-2 px-5 py-2 text-sm text-primary-white"
          disabled={isCreating || !draft.name.trim()}
        >
          {isCreating ? <InlineSpinner /> : null}
          Create
        </button>
      </form>

      {collections.length === 0 ? (
        <EmptyState
          title="No collections yet"
          description="Create a reading collection to start organizing books."
        />
      ) : (
        <div className="grid gap-4">
          {collections.map((collection) => (
            <CollectionRow
              key={collection.id}
              collection={collection}
              isSaving={isUpdating}
              isDeleting={isDeleting}
              onUpdate={updateCollection}
              onDelete={deleteCollection}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CollectionRowProps {
  collection: ReadingCollection;
  isSaving: boolean;
  isDeleting: boolean;
  onUpdate: (listId: number, payload: UpdateCollectionPayload) => Promise<ReadingCollection>;
  onDelete: (listId: number) => Promise<void>;
}

function CollectionRow({
  collection,
  isSaving,
  isDeleting,
  onUpdate,
  onDelete,
}: CollectionRowProps): ReactElement {
  const [draft, setDraft] = useState<CollectionDraft>(() =>
    collectionDraft(collection)
  );
  const [isEditing, setIsEditing] = useState(false);
  const hasChanges =
    draft.name !== collection.name ||
    draft.type !== (collection.list_type ?? "custom") ||
    draft.privacy !== (collection.privacy ?? "private");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    const name = draft.name.trim();
    if (!name || !hasChanges) return;

    await onUpdate(collection.id, {
      name,
      list_type: draft.type,
      privacy: draft.privacy,
    });
    setIsEditing(false);
  };

  return (
    <article className="glass-card p-5">
      <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_140px_140px_auto] lg:items-end">
        <div className="min-w-0">
          {isEditing ? (
            <TextField
              id={`collection-name-${collection.id}`}
              label="Name"
              value={draft.name}
              onChange={(name) => setDraft((current) => ({ ...current, name }))}
              required
            />
          ) : (
            <div className="flex min-h-[44px] flex-col justify-center gap-1">
              <Link
                to={routeBuilders.collection(collection.id)}
                className="line-clamp-1 text-lg font-bold text-primary-white hover:text-accent"
              >
                {collection.name}
              </Link>
              <p className="text-sm text-primary-gray">
                {collection.item_count ?? collection.items?.length ?? 0} books
              </p>
            </div>
          )}
        </div>
        <SelectField
          id={`collection-type-${collection.id}`}
          label="Type"
          value={draft.type}
          options={typeOptions}
          disabled={!isEditing}
          onChange={(type) => setDraft((current) => ({ ...current, type }))}
        />
        <SelectField
          id={`collection-privacy-${collection.id}`}
          label="Privacy"
          value={draft.privacy}
          options={privacyOptions}
          disabled={!isEditing}
          onChange={(privacy) => setDraft((current) => ({ ...current, privacy }))}
        />
        <div className="flex flex-wrap gap-2">
          {isEditing ? (
            <button
              type="submit"
              className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center gap-2 px-4 py-2 text-sm text-primary-white"
              disabled={isSaving || !draft.name.trim() || !hasChanges}
            >
              {isSaving ? <InlineSpinner /> : null}
              Save
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary-v min-h-[44px] px-4 py-2 text-sm text-primary-white"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </button>
          )}
          <button
            type="button"
            className="min-h-[44px] rounded-full px-4 py-2 text-sm font-semibold text-primary-gray hover:bg-primary-black hover:text-primary-white"
            onClick={() => {
              setDraft(collectionDraft(collection));
              setIsEditing(false);
            }}
          >
            Reset
          </button>
          <button
            type="button"
            className="min-h-[44px] rounded-full px-4 py-2 text-sm font-semibold text-accent hover:bg-primary-black"
            disabled={isDeleting}
            onClick={() => void onDelete(collection.id)}
          >
            Delete
          </button>
        </div>
      </form>
    </article>
  );
}

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  required?: boolean;
  onChange: (value: string) => void;
}

function TextField({
  id,
  label,
  value,
  required = false,
  onChange,
}: TextFieldProps): ReactElement {
  return (
    <label htmlFor={id} className="flex flex-col gap-2 text-sm font-medium text-primary-gray">
      {label}
      <input
        id={id}
        className="field text-primary-white"
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

interface SelectFieldProps<TValue extends string> {
  id: string;
  label: string;
  value: TValue;
  options: readonly TValue[];
  disabled?: boolean;
  onChange: (value: TValue) => void;
}

function SelectField<TValue extends string>({
  id,
  label,
  value,
  options,
  disabled = false,
  onChange,
}: SelectFieldProps<TValue>): ReactElement {
  return (
    <label htmlFor={id} className="flex flex-col gap-2 text-sm font-medium text-primary-gray">
      {label}
      <select
        id={id}
        className="field text-primary-white"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as TValue)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function CollectionsSkeleton(): ReactElement {
  return (
    <div className="flex max-w-[1120px] flex-col gap-5 py-12" role="status">
      <div className="h-10 w-56 rounded-full animate-shimmer" />
      <div className="h-24 rounded-xl animate-shimmer" />
      <div className="h-24 rounded-xl animate-shimmer" />
      <div className="h-24 rounded-xl animate-shimmer" />
    </div>
  );
}
