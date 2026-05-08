import { useState, type FormEvent, type ReactElement } from "react";

import {
  EmptyState,
  ErrorState,
  InlineSpinner,
  Pagination,
} from "../../../components/ui";
import { usePageSearchParam } from "../../../hooks/usePageSearchParam";
import { useAuth } from "../../auth/hooks/useAuth";
import { useAdminBooks } from "../hooks/useAdminBooks";
import type { Book, BookWritePayload } from "../types/book";

interface BookFormState {
  isbn_13: string;
  title: string;
  cover_fallback_url: string;
}

const emptyBookForm: BookFormState = {
  isbn_13: "",
  title: "",
  cover_fallback_url: "",
};

function toBookPayload(state: BookFormState): BookWritePayload {
  const payload: BookWritePayload = {};
  const isbnValue = state.isbn_13.trim();
  const title = state.title.trim();
  const coverUrl = state.cover_fallback_url.trim();

  if (isbnValue) payload.isbn_13 = isbnValue;
  if (title) payload.title = title;
  if (coverUrl) payload.cover_fallback_url = coverUrl;

  return payload;
}

function getAuthorText(book: Book): string {
  return (book.authors ?? [])
    .map((author) => author.name)
    .join(", ");
}

function getBookFormState(book: Book): BookFormState {
  return {
    isbn_13: book.isbn_13 ?? "",
    title: book.title,
    cover_fallback_url: book.cover_fallback_url ?? "",
  };
}

export default function AdminBooksPage(): ReactElement {
  const { token } = useAuth();
  const { page, setPage } = usePageSearchParam();
  const [createForm, setCreateForm] = useState<BookFormState>(emptyBookForm);
  const [editingBookId, setEditingBookId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<BookFormState>(emptyBookForm);
  const {
    books,
    pagination,
    isLoading,
    isFetching,
    isError,
    isCreating,
    isUpdating,
    isDeleting,
    createBook,
    updateBook,
    deleteBook,
    refetch,
  } = useAdminBooks(token, page);

  const handleCreate = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void createBook(toBookPayload(createForm)).then(() => setCreateForm(emptyBookForm));
  };

  const startEditing = (book: Book): void => {
    setEditingBookId(book.id);
    setEditForm(getBookFormState(book));
  };

  const handleUpdate = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!editingBookId) return;

    void updateBook(editingBookId, toBookPayload(editForm)).then(() =>
      setEditingBookId(null)
    );
  };

  return (
    <div className="flex flex-col gap-8 py-12 animate-fade-up">
      <header className="flex flex-col gap-3">
        <h1 className="display-heading text-3xl sm:text-4xl">Book Admin</h1>
        <p className="max-w-2xl text-sm text-primary-gray">
          Manage catalog records.
        </p>
      </header>

      <BookForm
        title="Create book"
        value={createForm}
        isBusy={isCreating}
        submitLabel="Create"
        onChange={setCreateForm}
        onSubmit={handleCreate}
      />

      {isLoading ? (
        <div className="py-8" role="status" aria-live="polite">
          <InlineSpinner />
        </div>
      ) : null}

      {isError ? (
        <ErrorState
          title="Books could not be loaded"
          message="We could not load the catalog admin list."
          onRetry={refetch}
          isRetrying={isFetching}
        />
      ) : null}

      {!isLoading && !isError && books.length === 0 ? (
        <EmptyState
          title="No books found"
          description="Create the first catalog record above."
        />
      ) : null}

      {!isLoading && !isError && books.length > 0 ? (
        <div className="flex flex-col gap-4">
          {books.map((book) => (
            <article key={book.id} className="settings-panel p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-primary-white">
                    {book.title}
                  </h2>
                  <p className="text-sm text-primary-gray">
                    {book.isbn_13 ?? `Book ${book.id}`} {getAuthorText(book)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-primary-v min-h-[40px] px-4 text-sm"
                    onClick={() => startEditing(book)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="min-h-[40px] rounded-lg px-4 text-sm font-semibold text-primary-gray hover:bg-primary-black hover:text-primary-white disabled:opacity-50"
                    disabled={isDeleting}
                    onClick={() => void deleteBook(book.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              {editingBookId === book.id ? (
                <BookForm
                  title={`Edit ${book.title}`}
                  value={editForm}
                  isBusy={isUpdating}
                  submitLabel="Save"
                  onChange={setEditForm}
                  onSubmit={handleUpdate}
                  onCancel={() => setEditingBookId(null)}
                />
              ) : null}
            </article>
          ))}
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            hasPreviousPage={pagination.hasPrevious}
            hasNextPage={pagination.hasNext}
            onPageChange={setPage}
            ariaLabel="Admin books pagination"
          />
        </div>
      ) : null}
    </div>
  );
}

interface BookFormProps {
  title: string;
  value: BookFormState;
  isBusy: boolean;
  submitLabel: string;
  onChange: (value: BookFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel?: (() => void) | undefined;
}

function BookForm({
  title,
  value,
  isBusy,
  submitLabel,
  onChange,
  onSubmit,
  onCancel,
}: BookFormProps): ReactElement {
  const updateField = (key: keyof BookFormState, nextValue: string): void => {
    onChange({ ...value, [key]: nextValue });
  };

  return (
    <form className="settings-panel grid gap-4 p-4 sm:p-5" onSubmit={onSubmit}>
      <h2 className="text-lg font-semibold text-primary-white">{title}</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <input
          value={value.isbn_13}
          onChange={(event) => updateField("isbn_13", event.target.value)}
          className="field text-primary-white"
          placeholder="ISBN13"
          required
        />
        <input
          value={value.title}
          onChange={(event) => updateField("title", event.target.value)}
          className="field text-primary-white"
          placeholder="Title"
          required
        />
        <input
          value={value.cover_fallback_url}
          onChange={(event) => updateField("cover_fallback_url", event.target.value)}
          className="field text-primary-white md:col-span-2"
          placeholder="Cover image URL"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center gap-2 px-5 text-sm"
          disabled={isBusy}
        >
          {isBusy ? <InlineSpinner /> : null}
          {submitLabel}
        </button>
        {onCancel ? (
          <button
            type="button"
            className="min-h-[44px] rounded-lg px-4 text-sm font-semibold text-primary-gray hover:bg-primary-black hover:text-primary-white"
            onClick={onCancel}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
