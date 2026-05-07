import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  createCollection,
  deleteCollection,
  getCollection,
  getCollections,
  removeFromCollection,
  updateCollection,
} from "../services/collectionService";
import type {
  AddToCollectionPayload,
  CreateCollectionPayload,
  ReadingList,
  UpdateCollectionPayload,
} from "../types/collection";
import { collectionKeys } from "./collection.keys";
import { profileKeys } from "../../profile/hooks/profile.keys";

interface UseCollectionsResult {
  collections: ReadingList[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  refetch: () => void;
  createCollection: (payload: CreateCollectionPayload) => Promise<ReadingList>;
  updateCollection: (
    listId: number,
    payload: UpdateCollectionPayload
  ) => Promise<ReadingList>;
  deleteCollection: (listId: number) => Promise<void>;
}

interface UseCollectionDetailResult {
  collection?: ReadingList | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isRemovingBook: boolean;
  refetch: () => void;
  removeBook: (bookId: string | undefined) => Promise<void>;
}

export function useCollections(token?: string | null): UseCollectionsResult {
  const queryClient = useQueryClient();
  const collectionsQuery = useQuery({
    queryKey: collectionKeys.list(),
    queryFn: () => getCollections(token),
    enabled: Boolean(token),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateCollectionPayload) =>
      createCollection(payload, token),
    onSuccess: () => {
      toast.success("Collection created.");
      queryClient.invalidateQueries({ queryKey: collectionKeys.list() });
      queryClient.invalidateQueries({ queryKey: profileKeys.collections() });
    },
    onError: () => {
      toast.error("Could not create the collection.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      listId,
      payload,
    }: {
      listId: number;
      payload: UpdateCollectionPayload;
    }) => updateCollection(listId, payload, token),
    onSuccess: (_collection, variables) => {
      toast.success("Collection updated.");
      queryClient.invalidateQueries({ queryKey: collectionKeys.list() });
      queryClient.invalidateQueries({
        queryKey: collectionKeys.detail(String(variables.listId)),
      });
      queryClient.invalidateQueries({ queryKey: profileKeys.collections() });
    },
    onError: () => {
      toast.error("Could not update the collection.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (listId: number) => deleteCollection(listId, token),
    onSuccess: (_result, listId) => {
      toast.success("Collection deleted.");
      queryClient.invalidateQueries({ queryKey: collectionKeys.list() });
      queryClient.removeQueries({
        queryKey: collectionKeys.detail(String(listId)),
      });
      queryClient.invalidateQueries({ queryKey: profileKeys.collections() });
    },
    onError: () => {
      toast.error("Could not delete the collection.");
    },
  });

  return {
    collections: collectionsQuery.data ?? [],
    isLoading: collectionsQuery.isLoading,
    isFetching: collectionsQuery.isFetching,
    isError: collectionsQuery.isError,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    refetch: () => void collectionsQuery.refetch(),
    createCollection: (payload) => createMutation.mutateAsync(payload),
    updateCollection: (listId, payload) =>
      updateMutation.mutateAsync({ listId, payload }),
    deleteCollection: (listId) => deleteMutation.mutateAsync(listId),
  };
}

export function useCollectionDetail(
  listId: string | undefined,
  token?: string | null
): UseCollectionDetailResult {
  const queryClient = useQueryClient();
  const collectionQuery = useQuery({
    queryKey: collectionKeys.detail(listId),
    queryFn: () => getCollection(listId, token),
    enabled: Boolean(listId),
  });

  const removeBookMutation = useMutation({
    mutationFn: (payload: AddToCollectionPayload) =>
      removeFromCollection(payload, token),
    onSuccess: () => {
      toast.success("Book removed from collection.");
      queryClient.invalidateQueries({ queryKey: collectionKeys.detail(listId) });
      queryClient.invalidateQueries({ queryKey: collectionKeys.list() });
      queryClient.invalidateQueries({ queryKey: profileKeys.collections() });
    },
    onError: () => {
      toast.error("Could not remove the book.");
    },
  });

  return {
    collection: collectionQuery.data,
    isLoading: collectionQuery.isLoading,
    isFetching: collectionQuery.isFetching,
    isError: collectionQuery.isError,
    isRemovingBook: removeBookMutation.isPending,
    refetch: () => void collectionQuery.refetch(),
    removeBook: (bookId) =>
      removeBookMutation.mutateAsync({
        list_id: listId ? Number(listId) : null,
        book_id: bookId,
      }),
  };
}
