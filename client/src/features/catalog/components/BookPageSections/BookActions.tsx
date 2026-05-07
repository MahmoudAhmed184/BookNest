import type { ReactElement } from "react";

import { InlineSpinner } from "../../../../components/ui";

export interface BookActionsProps {
  isAddPending: boolean;
  isMarkReadPending: boolean;
  canAddToList: boolean;
  canMarkAsRead: boolean;
  onAddBook: () => void;
  onMarkAsRead: () => void;
}

export function BookActions({
  isAddPending,
  isMarkReadPending,
  canAddToList,
  canMarkAsRead,
  onAddBook,
  onMarkAsRead,
}: BookActionsProps): ReactElement {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <button
        type="button"
        onClick={onAddBook}
        disabled={isAddPending || !canAddToList}
        className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center gap-2 px-5 py-2 text-primary-white shadow-md hover:-translate-y-0.5 hover:shadow-lg"
      >
        {isAddPending ? <InlineSpinner /> : null}
        Add to List
      </button>
      <button
        type="button"
        onClick={onMarkAsRead}
        disabled={isMarkReadPending || !canMarkAsRead}
        className="btn btn-primary-v inline-flex min-h-[44px] items-center justify-center gap-2 px-5 py-2 text-primary-white shadow-md hover:-translate-y-0.5 hover:shadow-lg"
      >
        {isMarkReadPending ? <InlineSpinner /> : null}
        Mark as Read
      </button>
    </div>
  );
}
