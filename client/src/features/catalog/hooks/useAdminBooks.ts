import { useEffect } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  createBook,
  deleteBook,
  getCatalogBooks,
  updateBook,
} from "../services/bookService";
import type { Book, BookWritePayload } from "../types/book";
import type { OffsetPaginatedResponse } from "../../../types/api";
import {
  getNextOffsetPageParam,
  mergeOffsetPages,
  shouldLoadNextOffsetPage,
} from "../../../lib/pagination";
import { catalogKeys } from "./catalog.keys";

const adminBooksPageSize = 24;

interface UseAdminBooksResult {
  books: Book[];
  pagination: OffsetPaginatedResponse<Book>;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isLoadingMore: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  createBook: (data: BookWritePayload) => Promise<Book>;
  updateBook: (id: string | number, data: BookWritePayload) => Promise<Book>;
  deleteBook: (id: string | number) => Promise<void>;
  refetch: () => void;
}

export function useAdminBooks(
  token: string | null | undefined,
  page = 1
): UseAdminBooksResult {
  const targetPage = Math.max(1, page);
  const queryClient = useQueryClient();
  const booksQuery = useInfiniteQuery({
    queryKey: catalogKeys.catalogBooksInfinite(adminBooksPageSize),
    queryFn: ({ pageParam }) =>
      getCatalogBooks({ page: pageParam, pageSize: adminBooksPageSize }),
    enabled: Boolean(token),
    initialPageParam: 1,
    getNextPageParam: getNextOffsetPageParam,
  });
  const pages = booksQuery.data?.pages;
  const loadedPage = pages?.[pages.length - 1]?.page ?? 0;
  const { fetchNextPage, hasNextPage, isError, isFetchingNextPage } = booksQuery;

  useEffect(() => {
    if (
      !shouldLoadNextOffsetPage({
        targetPage,
        loadedPage,
        hasNextPage,
        isFetchingNextPage,
        isError,
      })
    ) {
      return;
    }

    void fetchNextPage();
  }, [
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    loadedPage,
    targetPage,
  ]);

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
  const pagination = mergeOffsetPages<Book>(pages, {
    page: targetPage,
    pageSize: adminBooksPageSize,
  });

  return {
    books: pagination.results,
    pagination,
    isLoading: booksQuery.isLoading,
    isFetching: booksQuery.isFetching,
    isError: booksQuery.isError,
    isLoadingMore:
      isFetchingNextPage ||
      (loadedPage > 0 && targetPage > loadedPage && hasNextPage),
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
