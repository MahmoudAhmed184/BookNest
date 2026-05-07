import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  createRating,
  createReview,
  deleteRating,
  updateRating,
  updateReview,
} from "../services/bookService";
import { addToCollection } from "../../collections/services/collectionService";
import { catalogKeys } from "./catalog.keys";
import { profileKeys } from "../../profile/hooks/profile.keys";

interface UseBookActionsOptions {
  id: string | undefined;
  completedListId: number | null;
  currentRatingId?: string | number | null | undefined;
  rating: number;
  reviewText: string;
  token?: string | null | undefined;
  onRatingDeleted: () => void;
  onReviewSubmitted: () => void;
}

interface UseBookActionsResult {
  isAddingBook: boolean;
  isMarkingAsRead: boolean;
  isSubmittingReview: boolean;
  isDeletingRating: boolean;
  isUpdatingReview: boolean;
  addBookToList: (listId: number) => void;
  markAsRead: () => void;
  deleteRating: () => void;
  editReview: (reviewId: string | number, reviewText: string) => void;
  submitRating: () => void;
  submitReview: () => void;
}

export function useBookActions({
  id,
  completedListId,
  currentRatingId,
  rating,
  reviewText,
  token,
  onRatingDeleted,
  onReviewSubmitted,
}: UseBookActionsOptions): UseBookActionsResult {
  const queryClient = useQueryClient();
  const ratingPayload = () => ({ book: id, rate: rating });
  const invalidateRatingState = (): void => {
    queryClient.invalidateQueries({ queryKey: catalogKeys.book(id) });
    queryClient.invalidateQueries({ queryKey: catalogKeys.ratings(id) });
    queryClient.invalidateQueries({ queryKey: catalogKeys.myRating(id) });
    queryClient.invalidateQueries({ queryKey: catalogKeys.recommendations() });
  };
  const saveRating = (): Promise<unknown> => {
    if (currentRatingId !== null && currentRatingId !== undefined) {
      return updateRating(currentRatingId, rating, token);
    }

    return createRating(ratingPayload(), token);
  };

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
      await saveRating();
      return createReview({ book: id, review_text: reviewText.trim() }, token);
    },
    onSuccess: () => {
      onReviewSubmitted();
      toast.success("Review submitted!");
      invalidateRatingState();
      queryClient.invalidateQueries({ queryKey: catalogKeys.reviewsBase(id) });
    },
    onError: () => {
      toast.error("Couldn't submit your review. Try again.");
    },
  });
  const ratingMutation = useMutation({
    mutationFn: saveRating,
    onSuccess: () => {
      toast.success("Rating saved.");
      invalidateRatingState();
    },
    onError: () => {
      toast.error("Couldn't save your rating. Try again.");
    },
  });
  const deleteRatingMutation = useMutation({
    mutationFn: () => {
      if (currentRatingId === null || currentRatingId === undefined) {
        throw new Error("No rating to delete");
      }

      return deleteRating(currentRatingId, token);
    },
    onSuccess: () => {
      onRatingDeleted();
      toast.success("Rating deleted.");
      invalidateRatingState();
    },
    onError: () => {
      toast.error("Couldn't delete your rating. Try again.");
    },
  });
  const updateReviewMutation = useMutation({
    mutationFn: ({
      reviewId,
      text,
    }: {
      reviewId: string | number;
      text: string;
    }) => updateReview(reviewId, text, token),
    onSuccess: () => {
      toast.success("Review updated.");
      queryClient.invalidateQueries({ queryKey: catalogKeys.reviewsBase(id) });
    },
    onError: () => {
      toast.error("Couldn't update your review. Try again.");
    },
  });

  return {
    isAddingBook: addBookMutation.isPending,
    isMarkingAsRead: markAsReadMutation.isPending,
    isSubmittingReview: reviewMutation.isPending || ratingMutation.isPending,
    isDeletingRating: deleteRatingMutation.isPending,
    isUpdatingReview: updateReviewMutation.isPending,
    addBookToList: (listId) => addBookMutation.mutate(listId),
    markAsRead: () => markAsReadMutation.mutate(),
    deleteRating: () => deleteRatingMutation.mutate(),
    editReview: (reviewId, text) =>
      updateReviewMutation.mutate({ reviewId, text }),
    submitRating: () => ratingMutation.mutate(),
    submitReview: () => reviewMutation.mutate(),
  };
}
