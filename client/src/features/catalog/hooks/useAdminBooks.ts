import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  createBook,
  deleteBook,
  getCatalogBooks,
  updateBook,
} from "../services/bookService";
import type { Book, BookWritePayload } from "../types/book";
import type { OffsetPaginatedResponse } from "../../../types/api";
import { catalogKeys } from "./catalog.keys";

const adminBooksPageSize = 24;

interface UseAdminBooksResult {
  books: Book[];
  pagination: OffsetPaginatedResponse<Book>;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  createBook: (data: BookWritePayload) => Promise<Book>;
  updateBook: (id: string | number, data: BookWritePayload) => Promise<Book>;
  deleteBook: (id: string | number) => Promise<void>;
  refetch: () => void;
}

function createEmptyPagination(
  page: number,
  pageSize: number
): OffsetPaginatedResponse<Book> {
  return {
    count: 0,
    next: null,
    previous: null,
    results: [],
    page,
    pageSize,
    totalPages: 0,
    hasNext: false,
    hasPrevious: page > 1,
  };
}

export function useAdminBooks(
  token: string | null | undefined,
  page = 1
): UseAdminBooksResult {
  const queryClient = useQueryClient();
  const booksQuery = useQuery({
    queryKey: catalogKeys.catalogBooks(page, adminBooksPageSize),
    queryFn: () => getCatalogBooks({ page, pageSize: adminBooksPageSize }),
    enabled: Boolean(token),
  });
  const invalidateBooks = (): void => {
    void queryClient.invalidateQueries({ queryKey: ["books"] });
  };
  const createMutation = useMutation({
    mutationFn: (data: BookWritePayload) => createBook(data, token),
    onSuccess: () => {
      toast.success("Book created.");
      invalidateBooks();
    },
  });
  const updateMutation = useMutation({
    mutationFn: (payload: { id: string | number; data: BookWritePayload }) =>
      updateBook(payload.id, payload.data, token),
    onSuccess: () => {
      toast.success("Book updated.");
      invalidateBooks();
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => deleteBook(id, token),
    onSuccess: () => {
      toast.success("Book deleted.");
      invalidateBooks();
    },
  });
  const pagination =
    booksQuery.data ?? createEmptyPagination(page, adminBooksPageSize);

  return {
    books: pagination.results,
    pagination,
    isLoading: booksQuery.isLoading,
    isFetching: booksQuery.isFetching,
    isError: booksQuery.isError,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createBook: (data: BookWritePayload) => createMutation.mutateAsync(data),
    updateBook: (id: string | number, data: BookWritePayload) =>
      updateMutation.mutateAsync({ id, data }),
    deleteBook: (id: string | number) => deleteMutation.mutateAsync(id),
    refetch: () => void booksQuery.refetch(),
  };
}
