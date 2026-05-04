import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  createRating,
  createReview,
} from "../services/bookService";
import { addToCollection } from "../../collections/services/collectionService";
import { catalogKeys } from "./catalog.keys";

interface UseBookActionsOptions {
  id: string | undefined;
  listId: number | null;
  rating: number;
  reviewText: string;
  onReviewSubmitted: () => void;
}

interface UseBookActionsResult {
  isAddingBook: boolean;
  isSubmittingReview: boolean;
  addBook: () => void;
  submitReview: () => void;
}

export function useBookActions({
  id,
  listId,
  rating,
  reviewText,
  onReviewSubmitted,
}: UseBookActionsOptions): UseBookActionsResult {
  const queryClient = useQueryClient();

  const addBookMutation = useMutation({
    mutationFn: () => addToCollection({ book_id: id, list_id: listId }),
    onSuccess: () => {
      toast.success("Added to your shelf!");
    },
    onError: () => {
      toast.error("Couldn't save. Try again.");
    },
  });
  const reviewMutation = useMutation({
    mutationFn: () => createReview({ user: 31, book: id, review_text: reviewText }),
    onSuccess: () => {
      onReviewSubmitted();
      toast.success("Review submitted!");
      queryClient.invalidateQueries({ queryKey: catalogKeys.reviews(id) });
    },
    onError: () => {
      toast.error("Couldn't submit your review. Try again.");
    },
  });
  const ratingMutation = useMutation({
    mutationFn: () => createRating({ book: id, rate: rating, user: 31 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.book(id) });
      queryClient.invalidateQueries({ queryKey: catalogKeys.ratings(id) });
    },
    onError: () => {
      toast.error("Couldn't save your rating. Try again.");
    },
  });

  return {
    isAddingBook: addBookMutation.isPending,
    isSubmittingReview: reviewMutation.isPending || ratingMutation.isPending,
    addBook: () => addBookMutation.mutate(),
    submitReview: () => {
      reviewMutation.mutate();
      ratingMutation.mutate();
    },
  };
}
