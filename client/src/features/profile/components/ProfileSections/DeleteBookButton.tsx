import type { ReactElement } from "react";

import { InlineSpinner } from "../../../../components/ui";
import type { Book } from "../../../catalog/types/book";

export interface DeleteBookButtonProps {
  book: Book;
  listId: number | null;
  isDeleting: boolean;
  onDeleteBook: (book: Book, listId: number | null) => void;
}

export function DeleteBookButton({
  book,
  listId,
  isDeleting,
  onDeleteBook,
}: DeleteBookButtonProps): ReactElement {
  return (
    <button
      type="button"
      onClick={() => onDeleteBook(book, listId)}
      className="absolute right-0 top-0 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-primary-black text-primary-white shadow-md hover:-translate-y-0.5 hover:bg-secondary-gray"
      aria-label={`Delete ${book.title} from collection`}
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
