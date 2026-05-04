import type { ReactElement } from "react";
import { Link } from "react-router-dom";

import { InlineSpinner } from "../../../../components/ui";
import { routePaths } from "../../../../routes/paths";

export interface BookActionsProps {
  isAddPending: boolean;
  canAddToList: boolean;
  onAddBook: () => void;
}

export function BookActions({
  isAddPending,
  canAddToList,
  onAddBook,
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
        Add to Library
      </button>
      <Link
        to={routePaths.myProfile}
        className="btn btn-primary-v inline-flex min-h-[44px] items-center justify-center px-5 py-2 text-primary-white shadow-md hover:-translate-y-0.5 hover:shadow-lg"
      >
        Mark as Read
      </Link>
    </div>
  );
}
