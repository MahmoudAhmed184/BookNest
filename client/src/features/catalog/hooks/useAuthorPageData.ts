import { useQuery } from "@tanstack/react-query";

import { getAuthor, getAuthorBooks } from "../services/bookService";
import type { Author, Book } from "../types/book";
import { catalogKeys } from "./catalog.keys";

interface UseAuthorPageDataResult {
  author?: Author | undefined;
  books: Book[];
  isAuthorLoading: boolean;
  isAuthorFetching: boolean;
  isAuthorError: boolean;
  isBooksLoading: boolean;
  isBooksFetching: boolean;
  isBooksError: boolean;
  refetchAuthor: () => void;
  refetchBooks: () => void;
}

export function useAuthorPageData(id: string | undefined): UseAuthorPageDataResult {
  const canLoad = Boolean(id);
  const authorQuery = useQuery({
    queryKey: catalogKeys.author(id),
    queryFn: () => getAuthor(id),
    enabled: canLoad,
  });
  const booksQuery = useQuery({
    queryKey: catalogKeys.authorBooks(id),
    queryFn: () => getAuthorBooks(id),
    enabled: canLoad,
  });

  return {
    author: authorQuery.data,
    books: booksQuery.data || [],
    isAuthorLoading: authorQuery.isLoading,
    isAuthorFetching: authorQuery.isFetching,
    isAuthorError: authorQuery.isError || !canLoad,
    isBooksLoading: booksQuery.isLoading,
    isBooksFetching: booksQuery.isFetching,
    isBooksError: booksQuery.isError,
    refetchAuthor: () => void authorQuery.refetch(),
    refetchBooks: () => void booksQuery.refetch(),
  };
}
