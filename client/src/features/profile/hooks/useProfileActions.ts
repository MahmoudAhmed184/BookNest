import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import { deleteBook } from "../../../services/bookService";
import { deleteReview } from "../../../services/userService";
import type { DeleteBookPayload } from "../../../types/book";
import { profileKeys } from "./profile.keys";

interface UseProfileActionsResult {
  isDeletingBook: boolean;
  isDeletingReview: boolean;
  deleteBookFromShelf: (payload: DeleteBookPayload) => void;
  deleteProfileReview: (reviewId: string | number) => void;
}

export function useProfileActions(): UseProfileActionsResult {
  const queryClient = useQueryClient();

  const deleteBookMutation = useMutation({
    mutationFn: (payload: DeleteBookPayload) => deleteBook(payload),
    onSuccess: () => {
      toast.success("Book removed from your shelf.");
      queryClient.invalidateQueries({ queryKey: profileKeys.collections() });
    },
    onError: () => {
      toast.error("Couldn't remove the book. Try again.");
    },
  });
  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId: string | number) => deleteReview(reviewId),
    onSuccess: () => {
      toast.success("Review deleted.");
      queryClient.invalidateQueries({ queryKey: profileKeys.reviews() });
    },
    onError: () => {
      toast.error("Couldn't delete the review. Try again.");
    },
  });

  return {
    isDeletingBook: deleteBookMutation.isPending,
    isDeletingReview: deleteReviewMutation.isPending,
    deleteBookFromShelf: (payload) => deleteBookMutation.mutate(payload),
    deleteProfileReview: (reviewId) => deleteReviewMutation.mutate(reviewId),
  };
}
