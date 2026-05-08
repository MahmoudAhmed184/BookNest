import type { ReactElement } from "react";

import { InlineSpinner } from "../../../../components/ui";
import type { CollectionBook } from "../../../collections/types/collection";

export interface DeleteBookButtonProps {
  item: CollectionBook;
  collectionName?: string | undefined;
  isDeleting: boolean;
  onDeleteBook: (item: CollectionBook) => void;
}

export function DeleteBookButton({
  item,
  isDeleting,
  onDeleteBook,
}: DeleteBookButtonProps): ReactElement {
  const title = item.book_detail?.title ?? "book";

  return (
    <button
      type="button"
      onClick={() => onDeleteBook(item)}
      className="absolute right-0 top-0 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-primary-black text-primary-white shadow-md hover:-translate-y-0.5 hover:bg-secondary-gray"
      aria-label={`Delete ${title} from collection`}
      disabled={isDeleting}
    >
      {isDeleting ? (
        <InlineSpinner />
      ) : (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
        </svg>
      )}
    </button>
  );
}
