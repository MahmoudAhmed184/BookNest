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
  CollectionBook,
  CreateCollectionPayload,
  ReadingCollection,
  UpdateCollectionPayload,
} from "../types/collection";
import { collectionKeys } from "./collection.keys";
import { profileKeys } from "../../profile/hooks/profile.keys";

interface UseCollectionsResult {
  collections: ReadingCollection[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  refetch: () => void;
  createCollection: (payload: CreateCollectionPayload) => Promise<ReadingCollection>;
  updateCollection: (
    collectionId: number,
    payload: UpdateCollectionPayload
  ) => Promise<ReadingCollection>;
  deleteCollection: (collectionId: number) => Promise<void>;
}

interface UseCollectionDetailResult {
  collection?: ReadingCollection | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isRemovingBook: boolean;
  refetch: () => void;
  removeBook: (item: CollectionBook) => Promise<void>;
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
      collectionId,
      payload,
    }: {
      collectionId: number;
      payload: UpdateCollectionPayload;
    }) => updateCollection(collectionId, payload, token),
    onSuccess: (_collection, variables) => {
      toast.success("Collection updated.");
      queryClient.invalidateQueries({ queryKey: collectionKeys.list() });
      queryClient.invalidateQueries({
        queryKey: collectionKeys.detail(String(variables.collectionId)),
      });
      queryClient.invalidateQueries({ queryKey: profileKeys.collections() });
    },
    onError: () => {
      toast.error("Could not update the collection.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (collectionId: number) => deleteCollection(collectionId, token),
    onSuccess: (_result, collectionId) => {
      toast.success("Collection deleted.");
      queryClient.invalidateQueries({ queryKey: collectionKeys.list() });
      queryClient.removeQueries({
        queryKey: collectionKeys.detail(String(collectionId)),
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
    updateCollection: (collectionId, payload) =>
      updateMutation.mutateAsync({ collectionId, payload }),
    deleteCollection: (collectionId) => deleteMutation.mutateAsync(collectionId),
  };
}

export function useCollectionDetail(
  collectionId: string | undefined,
  token?: string | null
): UseCollectionDetailResult {
  const queryClient = useQueryClient();
  const collectionQuery = useQuery({
    queryKey: collectionKeys.detail(collectionId),
    queryFn: () => getCollection(collectionId, token),
    enabled: Boolean(collectionId),
  });

  const removeBookMutation = useMutation({
    mutationFn: (item: CollectionBook) => removeFromCollection(item.id, token),
    onSuccess: () => {
      toast.success("Book removed from collection.");
      queryClient.invalidateQueries({ queryKey: collectionKeys.detail(collectionId) });
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
    removeBook: (item) => removeBookMutation.mutateAsync(item),
  };
}
