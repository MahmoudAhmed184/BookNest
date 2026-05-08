import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  createRating,
  createReview,
  deleteRating,
  deleteReviewVote,
  updateRating,
  updateReview,
  voteOnReview,
} from "../services/bookService";
import type { BookRating, ReviewVoteType } from "../types/book";
import {
  addToCollection,
  saveReadingProgress,
} from "../../collections/services/collectionService";
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
  isVotingReview: boolean;
  addBookToList: (listId: number) => void;
  markAsRead: () => void;
  deleteRating: () => void;
  editReview: (reviewId: string | number, reviewText: string) => void;
  voteReview: (reviewId: string | number, voteType: ReviewVoteType) => void;
  deleteReviewVote: (reviewId: string | number) => void;
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
  const bookId = id ? Number(id) : undefined;
  const ratingPayload = () => ({ book: bookId, value: rating });
  const invalidateRatingState = (): void => {
    queryClient.invalidateQueries({ queryKey: catalogKeys.book(id) });
    queryClient.invalidateQueries({ queryKey: catalogKeys.ratings(id) });
    queryClient.invalidateQueries({ queryKey: catalogKeys.myRating(id) });
    queryClient.invalidateQueries({ queryKey: catalogKeys.recommendations() });
  };
  const saveRating = (): Promise<BookRating> => {
    if (currentRatingId !== null && currentRatingId !== undefined) {
      return updateRating(currentRatingId, rating, token);
    }

    return createRating(ratingPayload(), token);
  };

  const addBookMutation = useMutation({
    mutationFn: (listId: number) =>
      addToCollection({ book: bookId, collection: listId }, token),
    onSuccess: () => {
      toast.success("Added to your shelf!");
      queryClient.invalidateQueries({ queryKey: profileKeys.collections() });
    },
    onError: () => {
      toast.error("Couldn't save. Try again.");
    },
  });
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      if (completedListId === null || bookId === undefined) {
        throw new Error("A completed collection is required");
      }

      await addToCollection(
        { book: bookId, collection: completedListId, status: "done" },
        token
      );
      return saveReadingProgress(
        {
          book: bookId,
          status: "done",
          percent_complete: 100,
          marked_read_at: new Date().toISOString(),
        },
        token
      );
    },
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
      const savedRating = await saveRating();
      const ratingId =
        typeof savedRating === "object" &&
        savedRating !== null &&
        "id" in savedRating &&
        typeof savedRating.id === "number"
          ? savedRating.id
          : null;

      return createReview(
        {
          book: bookId,
          rating: ratingId,
          body: reviewText.trim(),
        },
        token
      );
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
  const voteReviewMutation = useMutation({
    mutationFn: ({
      reviewId,
      voteType,
    }: {
      reviewId: string | number;
      voteType: ReviewVoteType;
    }) => voteOnReview(reviewId, voteType, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.reviewsBase(id) });
      queryClient.invalidateQueries({ queryKey: catalogKeys.reviewVotes() });
    },
    onError: () => {
      toast.error("Couldn't save your vote. Try again.");
    },
  });
  const deleteReviewVoteMutation = useMutation({
    mutationFn: (reviewId: string | number) => deleteReviewVote(reviewId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.reviewsBase(id) });
      queryClient.invalidateQueries({ queryKey: catalogKeys.reviewVotes() });
    },
    onError: () => {
      toast.error("Couldn't remove your vote. Try again.");
    },
  });

  return {
    isAddingBook: addBookMutation.isPending,
    isMarkingAsRead: markAsReadMutation.isPending,
    isSubmittingReview: reviewMutation.isPending || ratingMutation.isPending,
    isDeletingRating: deleteRatingMutation.isPending,
    isUpdatingReview: updateReviewMutation.isPending,
    isVotingReview:
      voteReviewMutation.isPending || deleteReviewVoteMutation.isPending,
    addBookToList: (listId) => addBookMutation.mutate(listId),
    markAsRead: () => markAsReadMutation.mutate(),
    deleteRating: () => deleteRatingMutation.mutate(),
    editReview: (reviewId, text) =>
      updateReviewMutation.mutate({ reviewId, text }),
    voteReview: (reviewId, voteType) =>
      voteReviewMutation.mutate({ reviewId, voteType }),
    deleteReviewVote: (reviewId) => deleteReviewVoteMutation.mutate(reviewId),
    submitRating: () => ratingMutation.mutate(),
    submitReview: () => reviewMutation.mutate(),
  };
}
