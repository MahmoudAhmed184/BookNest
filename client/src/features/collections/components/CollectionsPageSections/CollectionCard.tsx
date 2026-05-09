import {
  useEffect,
  useState,
  type FormEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";

import { InlineSpinner } from "../../../../components/ui";
import { routeBuilders } from "../../../../routes/paths";
import { getFallbackHueStyle, getInitials } from "../../../../utils/colorFromString";
import type { Book } from "../../../catalog/types/book";
import type {
  CollectionPrivacy,
  ReadingCollection,
  ReadingCollectionStatus,
  UpdateCollectionPayload,
} from "../../types/collection";
import {
  collectionPrivacyOptions,
  collectionPrivacyToneClasses,
  collectionTypeLabel,
  collectionTypeOptions,
  collectionTypeToneClasses,
  collectionPrivacyLabel,
  formatBookCount,
  formatCollectionDate,
  getCollectionBookCount,
  getCollectionPreviewBooks,
} from "../../utils/collectionPresentation";
import {
  ArrowRightIcon,
  EditIcon,
  GlobeIcon,
  LockIcon,
  TrashIcon,
  XIcon,
} from "./CollectionIcons";
import { SegmentedField, TextareaField, TextField } from "./CollectionFormFields";

interface CollectionDraft {
  name: string;
  description: string;
  type: ReadingCollectionStatus;
  privacy: CollectionPrivacy;
}

function collectionDraft(collection: ReadingCollection): CollectionDraft {
  return {
    name: collection.name,
    description: collection.description ?? "",
    type: collection.list_type ?? "custom",
    privacy: collection.privacy ?? "private",
  };
}

interface CollectionCardProps {
  collection: ReadingCollection;
  isSaving: boolean;
  isDeleting: boolean;
  onUpdate: (
    collectionId: number,
    payload: UpdateCollectionPayload
  ) => Promise<ReadingCollection>;
  onDelete: (collectionId: number) => Promise<void>;
}

export function CollectionCard({
  collection,
  isSaving,
  isDeleting,
  onUpdate,
  onDelete,
}: CollectionCardProps): ReactElement {
  const [draft, setDraft] = useState<CollectionDraft>(() =>
    collectionDraft(collection)
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const type = collection.list_type ?? "custom";
  const privacy = collection.privacy ?? "private";
  const bookCount = getCollectionBookCount(collection);
  const updatedLabel = formatCollectionDate(
    collection.last_book_added_at ?? collection.updated_at ?? collection.created_at
  );
  const trimmedName = draft.name.trim();
  const trimmedDescription = draft.description.trim();
  const currentDescription = (collection.description ?? "").trim();
  const hasChanges =
    trimmedName !== collection.name.trim() ||
    trimmedDescription !== currentDescription ||
    draft.type !== type ||
    draft.privacy !== privacy;
  const canSave = trimmedName.length >= 2 && hasChanges && !isSaving;

  useEffect(() => {
    if (!isEditing) {
      setDraft({
        name: collection.name,
        description: collection.description ?? "",
        type: collection.list_type ?? "custom",
        privacy: collection.privacy ?? "private",
      });
    }
  }, [
    collection.name,
    collection.description,
    collection.list_type,
    collection.privacy,
    isEditing,
  ]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    if (!canSave) return;

    await onUpdate(collection.id, {
      name: trimmedName,
      description: trimmedDescription,
      list_type: draft.type,
      privacy: draft.privacy,
    });
    setIsEditing(false);
  };

  const resetDraft = (): void => {
    setDraft(collectionDraft(collection));
    setIsEditing(false);
    setIsConfirmingDelete(false);
  };

  const handleDelete = async (): Promise<void> => {
    await onDelete(collection.id);
    setIsConfirmingDelete(false);
  };

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-[var(--surface-glass-border)] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--surface-panel)_92%,transparent),color-mix(in_srgb,var(--surface-panel-strong)_80%,transparent))] shadow-md backdrop-blur-xl transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-accent/35 hover:shadow-lg">
      <CollectionPreview collection={collection} />

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              to={routeBuilders.collection(collection.id)}
              className="line-clamp-2 font-display text-2xl font-bold leading-tight text-primary-white hover:text-accent"
            >
              {collection.name}
            </Link>
            <p className="mt-1 text-sm font-medium text-primary-gray">
              {formatBookCount(bookCount)}
              {updatedLabel ? ` / Updated ${updatedLabel}` : ""}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <IconLink
              to={routeBuilders.collection(collection.id)}
              label={`Open ${collection.name}`}
            >
              <ArrowRightIcon />
            </IconLink>
            <IconButton
              label={`Edit ${collection.name}`}
              onClick={() => {
                setIsEditing(true);
                setIsConfirmingDelete(false);
              }}
            >
              <EditIcon />
            </IconButton>
            <IconButton
              label={`Delete ${collection.name}`}
              tone="danger"
              onClick={() => {
                setIsConfirmingDelete(true);
                setIsEditing(false);
              }}
            >
              <TrashIcon />
            </IconButton>
          </div>
        </div>

        <p className="line-clamp-2 min-h-12 text-sm text-primary-gray">
          {collection.description?.trim() || "No description yet."}
        </p>

        <div className="flex flex-wrap gap-2">
          <CollectionBadge className={collectionTypeToneClasses[type]}>
            {collectionTypeLabel(type)}
          </CollectionBadge>
          <CollectionBadge className={collectionPrivacyToneClasses[privacy]}>
            {privacy === "private" ? <LockIcon /> : <GlobeIcon />}
            {collectionPrivacyLabel(privacy)}
          </CollectionBadge>
        </div>

        {isEditing ? (
          <form
            className="mt-1 flex flex-col gap-4 border-t border-[var(--surface-glass-border)] pt-4"
            onSubmit={handleSubmit}
          >
            <TextField
              id={`collection-name-${collection.id}`}
              label="Name"
              value={draft.name}
              required
              minLength={2}
              disabled={isSaving}
              onValueChange={(name) =>
                setDraft((current) => ({ ...current, name }))
              }
            />
            <TextareaField
              id={`collection-description-${collection.id}`}
              label="Description"
              value={draft.description}
              maxLength={240}
              disabled={isSaving}
              onValueChange={(description) =>
                setDraft((current) => ({ ...current, description }))
              }
            />
            <SegmentedField
              legend="Type"
              name={`collection-type-${collection.id}`}
              value={draft.type}
              options={collectionTypeOptions}
              disabled={isSaving}
              onChange={(nextType) =>
                setDraft((current) => ({ ...current, type: nextType }))
              }
            />
            <SegmentedField
              legend="Privacy"
              name={`collection-privacy-${collection.id}`}
              value={draft.privacy}
              options={collectionPrivacyOptions}
              disabled={isSaving}
              onChange={(nextPrivacy) =>
                setDraft((current) => ({ ...current, privacy: nextPrivacy }))
              }
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm text-primary-white"
                disabled={!canSave}
                aria-busy={isSaving}
              >
                {isSaving ? <InlineSpinner /> : null}
                Save
              </button>
              <button
                type="button"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-[var(--surface-glass-border)] px-4 py-2 text-sm font-semibold text-primary-gray hover:border-accent/60 hover:text-primary-white"
                onClick={resetDraft}
                disabled={isSaving}
              >
                <XIcon />
                Cancel
              </button>
            </div>
          </form>
        ) : null}

        {isConfirmingDelete ? (
          <div
            className="mt-auto rounded-lg border border-destructive/35 bg-destructive/10 p-3"
            role="alert"
          >
            <p className="text-sm font-semibold text-primary-white">
              Delete this collection?
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[var(--surface-glass-border)] px-3 py-2 text-sm font-semibold text-primary-gray hover:border-accent/60 hover:text-primary-white"
                onClick={() => setIsConfirmingDelete(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg bg-destructive px-3 py-2 text-sm font-semibold text-destructive-contrast hover:brightness-110"
                onClick={() => void handleDelete()}
                disabled={isDeleting}
                aria-busy={isDeleting}
              >
                {isDeleting ? <InlineSpinner /> : <TrashIcon />}
                Delete
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}

interface CollectionPreviewProps {
  collection: ReadingCollection;
}

function CollectionPreview({
  collection,
}: CollectionPreviewProps): ReactElement {
  const books = getCollectionPreviewBooks(collection);
  const bookCount = getCollectionBookCount(collection);

  if (!books.length) {
    return (
      <div
        className="fallback-gradient flex aspect-[16/9] items-center justify-between gap-4 p-5 text-primary-white"
        style={getFallbackHueStyle(collection.name)}
      >
        <div>
          <p className="text-sm font-bold uppercase text-primary-white/75">
            Shelf
          </p>
          <p className="mt-2 text-4xl font-black leading-none">
            {getInitials(collection.name)}
          </p>
        </div>
        <p className="rounded-lg border border-white/20 bg-black/25 px-3 py-2 text-sm font-bold backdrop-blur">
          {formatBookCount(bookCount)}
        </p>
      </div>
    );
  }

  return (
    <div className="grid aspect-[16/9] grid-cols-4 gap-1 overflow-hidden bg-primary-black p-2">
      {books.map((book, index) => (
        <PreviewCover key={`${book.id}-${index}`} book={book} />
      ))}
      {Array.from({ length: Math.max(0, 4 - books.length) }, (_, index) => (
        <div
          key={`empty-${index}`}
          className="rounded-md border border-dashed border-white/15 bg-white/5"
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

interface PreviewCoverProps {
  book: Book;
}

function PreviewCover({ book }: PreviewCoverProps): ReactElement {
  const [hasImageError, setHasImageError] = useState(false);
  const cover = book.cover ?? book.cover_fallback_url;

  if (!cover || hasImageError) {
    return (
      <div
        className="fallback-gradient flex h-full min-h-0 items-center justify-center rounded-md px-2 text-center text-lg font-black text-primary-white"
        style={getFallbackHueStyle(book.title)}
      >
        <span aria-hidden="true">{getInitials(book.title)}</span>
        <span className="sr-only">Cover unavailable for {book.title}</span>
      </div>
    );
  }

  return (
    <img
      src={cover}
      alt={`Cover of ${book.title}`}
      className="h-full min-h-0 w-full rounded-md object-cover shadow-md"
      loading="lazy"
      decoding="async"
      onError={() => setHasImageError(true)}
    />
  );
}

interface CollectionBadgeProps {
  children: ReactNode;
  className: string;
}

function CollectionBadge({
  children,
  className,
}: CollectionBadgeProps): ReactElement {
  return (
    <span
      className={`inline-flex min-h-[32px] items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold ${className}`}
    >
      {children}
    </span>
  );
}

interface IconButtonProps {
  label: string;
  children: ReactNode;
  tone?: "default" | "danger";
  onClick: () => void;
}

function IconButton({
  label,
  children,
  tone = "default",
  onClick,
}: IconButtonProps): ReactElement {
  const toneClass =
    tone === "danger"
      ? "text-destructive hover:border-destructive/60 hover:bg-destructive/10"
      : "text-primary-gray hover:border-accent/60 hover:bg-accent/10 hover:text-primary-white";

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--surface-glass-border)] bg-primary-black/25 ${toneClass}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

interface IconLinkProps {
  to: string;
  label: string;
  children: ReactNode;
}

function IconLink({ to, label, children }: IconLinkProps): ReactElement {
  return (
    <Link
      to={to}
      title={label}
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--surface-glass-border)] bg-primary-black/25 text-primary-gray hover:border-accent/60 hover:bg-accent/10 hover:text-primary-white"
    >
      {children}
    </Link>
  );
}
