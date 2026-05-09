import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  getAuthor,
  getAuthorBooks,
  likeAuthor,
  listAuthorLikes,
  unlikeAuthor,
} from "../services/bookService";
import type { Author, AuthorLike, Book } from "../types/book";
import { catalogKeys } from "./catalog.keys";

interface UseAuthorPageDataResult {
  author?: Author | undefined;
  books: Book[];
  authorLikes: AuthorLike[];
  isLiked: boolean;
  isAuthorLoading: boolean;
  isAuthorFetching: boolean;
  isAuthorError: boolean;
  isBooksLoading: boolean;
  isBooksFetching: boolean;
  isBooksError: boolean;
  isTogglingLike: boolean;
  toggleAuthorLike: () => void;
  refetchAuthor: () => void;
  refetchBooks: () => void;
}

export function useAuthorPageData(
  id: string | undefined,
  token?: string | null
): UseAuthorPageDataResult {
  const queryClient = useQueryClient();
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
  const likesQuery = useQuery({
    queryKey: catalogKeys.authorLikes(),
    queryFn: () => listAuthorLikes(token),
    enabled: Boolean(token),
  });
  const authorId = id ? Number(id) : null;
  const existingLike = likesQuery.data?.find(
    (like) => like.author === authorId
  );
  const invalidateLikes = (): void => {
    queryClient.invalidateQueries({ queryKey: catalogKeys.authorLikes() });
    queryClient.invalidateQueries({ queryKey: catalogKeys.author(id) });
  };
  const likeMutation = useMutation({
    mutationFn: () => {
      if (authorId === null) throw new Error("Author id is required");
      return likeAuthor(authorId, token);
    },
    onSuccess: () => {
      toast.success("Author added to favorites.");
      invalidateLikes();
    },
    onError: () => {
      toast.error("Couldn't favorite this author. Try again.");
    },
  });
  const unlikeMutation = useMutation({
    mutationFn: () => {
      if (!existingLike) throw new Error("Author like is required");
      return unlikeAuthor(existingLike.id, token);
    },
    onSuccess: () => {
      toast.success("Author removed from favorites.");
      invalidateLikes();
    },
    onError: () => {
      toast.error("Couldn't update this author. Try again.");
    },
  });

  return {
    author: authorQuery.data,
    books: booksQuery.data || [],
    authorLikes: likesQuery.data || [],
    isLiked: Boolean(existingLike),
    isAuthorLoading: authorQuery.isLoading,
    isAuthorFetching: authorQuery.isFetching,
    isAuthorError: authorQuery.isError || !canLoad,
    isBooksLoading: booksQuery.isLoading,
    isBooksFetching: booksQuery.isFetching,
    isBooksError: booksQuery.isError,
    isTogglingLike: likeMutation.isPending || unlikeMutation.isPending,
    toggleAuthorLike: () => {
      if (!token) {
        toast.error("Sign in to favorite authors.");
        return;
      }
      if (existingLike) {
        unlikeMutation.mutate();
        return;
      }
      likeMutation.mutate();
    },
    refetchAuthor: () => void authorQuery.refetch(),
    refetchBooks: () => void booksQuery.refetch(),
  };
}
