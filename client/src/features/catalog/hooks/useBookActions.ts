import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  createRating,
  createReview,
} from "../services/bookService";
import { addToCollection } from "../../collections/services/collectionService";
import { catalogKeys } from "./catalog.keys";
import { profileKeys } from "../../profile/hooks/profile.keys";

interface UseBookActionsOptions {
  id: string | undefined;
  completedListId: number | null;
  rating: number;
  reviewText: string;
  token?: string | null | undefined;
  onReviewSubmitted: () => void;
}

interface UseBookActionsResult {
  isAddingBook: boolean;
  isMarkingAsRead: boolean;
  isSubmittingReview: boolean;
  addBookToList: (listId: number) => void;
  markAsRead: () => void;
  submitRating: () => void;
  submitReview: () => void;
}

export function useBookActions({
  id,
  completedListId,
  rating,
  reviewText,
  token,
  onReviewSubmitted,
}: UseBookActionsOptions): UseBookActionsResult {
  const queryClient = useQueryClient();
  const ratingPayload = () => ({ book: id, rate: rating });

  const addBookMutation = useMutation({
    mutationFn: (listId: number) =>
      addToCollection({ book_id: id, list_id: listId }, token),
    onSuccess: () => {
      toast.success("Added to your shelf!");
      queryClient.invalidateQueries({ queryKey: profileKeys.collections() });
    },
    onError: () => {
      toast.error("Couldn't save. Try again.");
    },
  });
  const markAsReadMutation = useMutation({
    mutationFn: () => addToCollection({ book_id: id, list_id: completedListId }, token),
    onSuccess: () => {
      toast.success("Marked as read.");
      queryClient.invalidateQueries({ queryKey: profileKeys.collections() });
    },
    onError: () => {
      toast.error("Couldn't mark this book as read. Try again.");
    },
  });
  const reviewMutation = useMutation({
    mutationFn: async () => {
      await createRating(ratingPayload(), token);
      return createReview({ book: id, review_text: reviewText.trim() }, token);
    },
    onSuccess: () => {
      onReviewSubmitted();
      toast.success("Review submitted!");
      queryClient.invalidateQueries({ queryKey: catalogKeys.book(id) });
      queryClient.invalidateQueries({ queryKey: catalogKeys.ratings(id) });
      queryClient.invalidateQueries({ queryKey: catalogKeys.reviews(id) });
      queryClient.invalidateQueries({ queryKey: catalogKeys.recommendations() });
    },
    onError: () => {
      toast.error("Couldn't submit your review. Try again.");
    },
  });
  const ratingMutation = useMutation({
    mutationFn: () => createRating(ratingPayload(), token),
    onSuccess: () => {
      toast.success("Rating saved.");
      queryClient.invalidateQueries({ queryKey: catalogKeys.book(id) });
      queryClient.invalidateQueries({ queryKey: catalogKeys.ratings(id) });
      queryClient.invalidateQueries({ queryKey: catalogKeys.recommendations() });
    },
    onError: () => {
      toast.error("Couldn't save your rating. Try again.");
    },
  });

  return {
    isAddingBook: addBookMutation.isPending,
    isMarkingAsRead: markAsReadMutation.isPending,
    isSubmittingReview: reviewMutation.isPending || ratingMutation.isPending,
    addBookToList: (listId) => addBookMutation.mutate(listId),
    markAsRead: () => markAsReadMutation.mutate(),
    submitRating: () => ratingMutation.mutate(),
    submitReview: () => reviewMutation.mutate(),
  };
}
