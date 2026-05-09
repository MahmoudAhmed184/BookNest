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
import type {
  BookRating,
  BookReview,
  ReviewVote,
  ReviewVoteType,
} from "../types/book";
import {
  addToCollection,
  saveReadingProgress,
} from "../../collections/services/collectionService";
import { collectionKeys } from "../../collections/hooks/collection.keys";
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
  isSavingRating: boolean;
  isDeletingRating: boolean;
  isUpdatingReview: boolean;
  isVotingReview: boolean;
  addBookToList: (listId: number) => void;
  markAsRead: () => void;
  deleteRating: () => void;
  editReview: (reviewId: string | number, reviewText: string) => void;
  voteReview: (reviewId: string | number, voteType: ReviewVoteType) => void;
  deleteReviewVote: (reviewId: string | number) => void;
  submitRating: (nextRating?: number) => void;
  submitReview: () => void;
}

interface ReviewMutationContext {
  previousReviews?: BookReview[] | undefined;
  previousReviewVotes?: ReviewVote[] | undefined;
}

function idsMatch(
  left: string | number | null | undefined,
  right: string | number | null | undefined
): boolean {
  return String(left) === String(right);
}

function countWithDelta(value: number | undefined, delta: number): number {
  return Math.max(0, (value ?? 0) + delta);
}

function voteDelta(
  voteType: ReviewVoteType,
  previousVote: ReviewVoteType | null | undefined,
  nextVote: ReviewVoteType | null | undefined
): number {
  return (nextVote === voteType ? 1 : 0) - (previousVote === voteType ? 1 : 0);
}

function reviewIdAsNumber(reviewId: string | number): number {
  return typeof reviewId === "number" ? reviewId : Number(reviewId);
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
  const ratingPayload = (value: number) => ({ book: bookId, value });
  const reviewsKey = catalogKeys.reviewsBase(id);
  const reviewVotesKey = catalogKeys.reviewVotes();
  const invalidateRatingState = (): void => {
    queryClient.invalidateQueries({ queryKey: catalogKeys.book(id) });
    queryClient.invalidateQueries({ queryKey: catalogKeys.ratings(id) });
    queryClient.invalidateQueries({ queryKey: catalogKeys.myRating(id) });
    queryClient.invalidateQueries({ queryKey: catalogKeys.recommendations() });
  };
  const requireAuth = (message: string): boolean => {
    if (token) return true;
    toast.error(message);
    return false;
  };
  const saveRating = (nextRating = rating): Promise<BookRating> => {
    if (!bookId || nextRating < 1) {
      throw new Error("A book and rating are required");
    }

    if (currentRatingId !== null && currentRatingId !== undefined) {
      return updateRating(currentRatingId, nextRating, token);
    }

    return createRating(ratingPayload(nextRating), token);
  };
  const getCachedReviewVotes = (): ReviewVote[] | undefined =>
    queryClient.getQueryData<ReviewVote[]>(reviewVotesKey);
  const findCachedReviewVote = (
    reviewId: string | number,
    votes = getCachedReviewVotes()
  ): ReviewVote | undefined =>
    votes?.find((vote) => idsMatch(vote.review, reviewId));
  const patchReviewInCache = (
    reviewId: string | number,
    updater: (review: BookReview) => BookReview
  ): void => {
    queryClient.setQueryData<BookReview[]>(reviewsKey, (reviews) =>
      reviews?.map((review) =>
        idsMatch(review.id, reviewId) ? updater(review) : review
      )
    );
  };
  const setReviewInCache = (savedReview: BookReview): void => {
    queryClient.setQueryData<BookReview[]>(reviewsKey, (reviews) => {
      if (!reviews) return [savedReview];
      const hasReview = reviews.some((review) =>
        idsMatch(review.id, savedReview.id)
      );

      return hasReview
        ? reviews.map((review) =>
            idsMatch(review.id, savedReview.id)
              ? { ...review, ...savedReview }
              : review
          )
        : [savedReview, ...reviews];
    });
  };
  const patchReviewVoteCounts = (
    reviewId: string | number,
    previousVote: ReviewVoteType | null | undefined,
    nextVote: ReviewVoteType | null | undefined
  ): void => {
    const upvoteDelta = voteDelta("up", previousVote, nextVote);
    const downvoteDelta = voteDelta("down", previousVote, nextVote);

    if (upvoteDelta === 0 && downvoteDelta === 0) return;

    patchReviewInCache(reviewId, (review) => {
      const nextReview: BookReview = {
        ...review,
        upvote_count: countWithDelta(review.upvote_count, upvoteDelta),
        downvote_count: countWithDelta(review.downvote_count, downvoteDelta),
      };

      if (typeof review.score === "number") {
        nextReview.score = review.score + upvoteDelta - downvoteDelta;
      }

      return nextReview;
    });
  };
  const upsertReviewVoteInCache = (
    reviewId: string | number,
    voteType: ReviewVoteType,
    savedVote?: ReviewVote | undefined
  ): void => {
    queryClient.setQueryData<ReviewVote[]>(reviewVotesKey, (votes = []) => {
      const existingVote = votes.find((vote) => idsMatch(vote.review, reviewId));
      const nextVote =
        savedVote ??
        ({
          id: existingVote?.id ?? -Date.now(),
          user: existingVote?.user ?? 0,
          review: reviewIdAsNumber(reviewId),
          vote_type: voteType,
          created_at: existingVote?.created_at ?? new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } satisfies ReviewVote);

      if (!existingVote) return [...votes, nextVote];

      return votes.map((vote) =>
        idsMatch(vote.review, reviewId) ? { ...vote, ...nextVote } : vote
      );
    });
  };
  const removeReviewVoteFromCache = (reviewId: string | number): void => {
    queryClient.setQueryData<ReviewVote[]>(reviewVotesKey, (votes = []) =>
      votes.filter((vote) => !idsMatch(vote.review, reviewId))
    );
  };

  const addBookMutation = useMutation({
    mutationFn: (listId: number) =>
      addToCollection({ book: bookId, collection: listId }, token),
    onSuccess: () => {
      toast.success("Added to your shelf!");
      queryClient.invalidateQueries({ queryKey: profileKeys.collections() });
      queryClient.invalidateQueries({ queryKey: collectionKeys.items() });
    },
    onError: () => {
      toast.error("Couldn't save. Try again.");
    },
  });
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      if (completedListId === null || bookId === undefined) {
        throw new Error("A completed collection is required.");
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
      queryClient.invalidateQueries({ queryKey: collectionKeys.items() });
    },
    onError: () => {
      toast.error("Couldn't mark this book as read. Try again.");
    },
  });
  const reviewMutation = useMutation({
    mutationFn: async () => {
      const savedRating = await saveRating(rating);
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
    onSuccess: (savedReview) => {
      onReviewSubmitted();
      toast.success("Review submitted!");
      setReviewInCache(savedReview);
      invalidateRatingState();
    },
    onError: () => {
      toast.error("Couldn't submit your review. Try again.");
    },
  });
  const ratingMutation = useMutation({
    mutationFn: (nextRating?: number) => saveRating(nextRating),
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
    onMutate: async ({ reviewId, text }) => {
      await queryClient.cancelQueries({ queryKey: reviewsKey });
      const previousReviews = queryClient.getQueryData<BookReview[]>(reviewsKey);

      patchReviewInCache(reviewId, (review) => ({
        ...review,
        body: text,
        is_edited: true,
        edited_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      return { previousReviews } satisfies ReviewMutationContext;
    },
    onSuccess: (savedReview) => {
      setReviewInCache(savedReview);
      toast.success("Review updated.");
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(reviewsKey, context?.previousReviews);
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
    onMutate: async ({ reviewId, voteType }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: reviewsKey }),
        queryClient.cancelQueries({ queryKey: reviewVotesKey }),
      ]);

      const previousReviews = queryClient.getQueryData<BookReview[]>(reviewsKey);
      const previousReviewVotes =
        queryClient.getQueryData<ReviewVote[]>(reviewVotesKey);
      const previousVote = findCachedReviewVote(reviewId, previousReviewVotes)
        ?.vote_type;

      patchReviewVoteCounts(reviewId, previousVote, voteType);
      upsertReviewVoteInCache(reviewId, voteType);

      return {
        previousReviews,
        previousReviewVotes,
      } satisfies ReviewMutationContext;
    },
    onSuccess: (savedVote, { reviewId, voteType }) => {
      upsertReviewVoteInCache(reviewId, voteType, savedVote);
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(reviewsKey, context?.previousReviews);
      queryClient.setQueryData(reviewVotesKey, context?.previousReviewVotes);
      toast.error("Couldn't save your vote. Try again.");
    },
  });
  const deleteReviewVoteMutation = useMutation({
    mutationFn: (reviewId: string | number) => deleteReviewVote(reviewId, token),
    onMutate: async (reviewId) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: reviewsKey }),
        queryClient.cancelQueries({ queryKey: reviewVotesKey }),
      ]);

      const previousReviews = queryClient.getQueryData<BookReview[]>(reviewsKey);
      const previousReviewVotes =
        queryClient.getQueryData<ReviewVote[]>(reviewVotesKey);
      const previousVote = findCachedReviewVote(reviewId, previousReviewVotes)
        ?.vote_type;

      patchReviewVoteCounts(reviewId, previousVote, null);
      removeReviewVoteFromCache(reviewId);

      return {
        previousReviews,
        previousReviewVotes,
      } satisfies ReviewMutationContext;
    },
    onError: (_error, _reviewId, context) => {
      queryClient.setQueryData(reviewsKey, context?.previousReviews);
      queryClient.setQueryData(reviewVotesKey, context?.previousReviewVotes);
      toast.error("Couldn't remove your vote. Try again.");
    },
  });

  return {
    isAddingBook: addBookMutation.isPending,
    isMarkingAsRead: markAsReadMutation.isPending,
    isSubmittingReview: reviewMutation.isPending || ratingMutation.isPending,
    isSavingRating: ratingMutation.isPending,
    isDeletingRating: deleteRatingMutation.isPending,
    isUpdatingReview: updateReviewMutation.isPending,
    isVotingReview:
      voteReviewMutation.isPending || deleteReviewVoteMutation.isPending,
    addBookToList: (listId) => {
      if (!requireAuth("Sign in to save books to a list.")) return;
      addBookMutation.mutate(listId);
    },
    markAsRead: () => {
      if (!requireAuth("Sign in to mark books as read.")) return;
      if (completedListId === null) {
        toast.error("Create a completed list before marking books as read.");
        return;
      }
      markAsReadMutation.mutate();
    },
    deleteRating: () => {
      if (!requireAuth("Sign in to manage ratings.")) return;
      deleteRatingMutation.mutate();
    },
    editReview: (reviewId, text) =>
      requireAuth("Sign in to edit reviews.") &&
      updateReviewMutation.mutate({ reviewId, text }),
    voteReview: (reviewId, voteType) => {
      if (!requireAuth("Sign in to vote on reviews.")) return;
      voteReviewMutation.mutate({ reviewId, voteType });
    },
    deleteReviewVote: (reviewId) => {
      if (!requireAuth("Sign in to manage review votes.")) return;
      deleteReviewVoteMutation.mutate(reviewId);
    },
    submitRating: (nextRating) => {
      if (!requireAuth("Sign in to rate books.")) return;
      ratingMutation.mutate(nextRating);
    },
    submitReview: () => {
      if (!requireAuth("Sign in to review books.")) return;
      reviewMutation.mutate();
    },
  };
}
