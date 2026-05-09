import type { ReactElement } from "react";

import { InlineSpinner } from "../../../../components/ui";

export interface BookActionsProps {
  isAddPending: boolean;
  isMarkReadPending: boolean;
  canAddToList: boolean;
  canMarkAsRead: boolean;
  listPopover?: ReactElement | null | undefined;
  addLabel?: string | undefined;
  markReadLabel?: string | undefined;
  onAddBook: () => void;
  onMarkAsRead: () => void;
}

function PlusIcon(): ReactElement {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function BookCheckIcon(): ReactElement {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5 4.5h7.5A2.5 2.5 0 0 1 15 7v8.5H7.5A2.5 2.5 0 0 0 5 18V4.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="m8 10 1.5 1.5L13 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BookActions({
  isAddPending,
  isMarkReadPending,
  canAddToList,
  canMarkAsRead,
  listPopover,
  addLabel = "Add to List",
  markReadLabel = "Mark as Read",
  onAddBook,
  onMarkAsRead,
}: BookActionsProps): ReactElement {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
      <div className="relative z-40 w-full sm:w-auto">
        <button
          type="button"
          onClick={onAddBook}
          disabled={isAddPending || !canAddToList}
          className="btn btn-accent-v inline-flex min-h-[44px] w-full items-center justify-center gap-2 px-5 py-2 text-sm text-primary-white shadow-md hover:-translate-y-0.5 hover:shadow-lg sm:w-auto"
        >
          {isAddPending ? <InlineSpinner /> : null}
          {!isAddPending ? <PlusIcon /> : null}
          {addLabel}
        </button>
        {listPopover}
      </div>
      <button
        type="button"
        onClick={onMarkAsRead}
        disabled={isMarkReadPending || !canMarkAsRead}
        className="btn btn-primary-v inline-flex min-h-[44px] items-center justify-center gap-2 px-5 py-2 text-sm text-primary-white shadow-md hover:-translate-y-0.5 hover:shadow-lg"
      >
        {isMarkReadPending ? <InlineSpinner /> : null}
        {!isMarkReadPending ? <BookCheckIcon /> : null}
        {markReadLabel}
      </button>
    </div>
  );
}
