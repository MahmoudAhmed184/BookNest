import { useId, useState, type FormEvent, type ReactElement } from "react";

import { InlineSpinner } from "../../../../components/ui";
import type {
  CollectionPrivacy,
  CreateCollectionPayload,
  ReadingCollection,
  ReadingCollectionStatus,
} from "../../types/collection";
import {
  collectionPrivacyOptions,
  collectionTypeOptions,
} from "../../utils/collectionPresentation";
import { PlusIcon } from "./CollectionIcons";
import { SegmentedField, TextareaField, TextField } from "./CollectionFormFields";

interface CollectionDraft {
  name: string;
  description: string;
  type: ReadingCollectionStatus;
  privacy: CollectionPrivacy;
}

const defaultDraft: CollectionDraft = {
  name: "",
  description: "",
  type: "custom",
  privacy: "private",
};

interface CollectionCreatePanelProps {
  isCreating: boolean;
  onCreate: (payload: CreateCollectionPayload) => Promise<ReadingCollection>;
}

export function CollectionCreatePanel({
  isCreating,
  onCreate,
}: CollectionCreatePanelProps): ReactElement {
  const formId = useId();
  const [draft, setDraft] = useState<CollectionDraft>(defaultDraft);
  const trimmedName = draft.name.trim();
  const canSubmit = trimmedName.length >= 2 && !isCreating;

  const handleCreate = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    if (!canSubmit) return;

    const payload: CreateCollectionPayload = {
      name: trimmedName,
      list_type: draft.type,
      privacy: draft.privacy,
    };
    const description = draft.description.trim();
    if (description) payload.description = description;

    await onCreate(payload);
    setDraft(defaultDraft);
  };

  return (
    <aside
      className="rounded-lg border border-[var(--surface-glass-border)] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--surface-panel)_92%,transparent),color-mix(in_srgb,var(--surface-panel-strong)_78%,transparent))] p-4 shadow-md backdrop-blur-xl lg:sticky lg:top-24"
      aria-labelledby={`${formId}-title`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2
            id={`${formId}-title`}
            className="text-xl font-bold text-primary-white"
          >
            Create collection
          </h2>
          <p className="mt-1 text-sm text-primary-gray">
            Build a shelf for books that belong together.
          </p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-accent">
          <PlusIcon className="h-5 w-5" />
        </span>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleCreate}>
        <TextField
          id={`${formId}-name`}
          label="Name"
          value={draft.name}
          placeholder="Weekend reads"
          required
          minLength={2}
          autoComplete="off"
          disabled={isCreating}
          onValueChange={(name) =>
            setDraft((current) => ({ ...current, name }))
          }
        />
        <TextareaField
          id={`${formId}-description`}
          label="Description"
          value={draft.description}
          placeholder="A short note for this shelf"
          maxLength={240}
          disabled={isCreating}
          onValueChange={(description) =>
            setDraft((current) => ({ ...current, description }))
          }
        />
        <SegmentedField
          legend="Type"
          name={`${formId}-type`}
          value={draft.type}
          options={collectionTypeOptions}
          disabled={isCreating}
          onChange={(type) => setDraft((current) => ({ ...current, type }))}
        />
        <SegmentedField
          legend="Privacy"
          name={`${formId}-privacy`}
          value={draft.privacy}
          options={collectionPrivacyOptions}
          disabled={isCreating}
          onChange={(privacy) =>
            setDraft((current) => ({ ...current, privacy }))
          }
        />
        <button
          type="submit"
          className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-5 py-2 text-sm text-primary-white"
          disabled={!canSubmit}
          aria-busy={isCreating}
        >
          {isCreating ? <InlineSpinner /> : <PlusIcon />}
          Create collection
        </button>
      </form>
    </aside>
  );
}
