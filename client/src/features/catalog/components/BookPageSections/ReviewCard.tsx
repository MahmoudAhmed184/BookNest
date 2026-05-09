import { useEffect, useId, useState, type ReactElement } from "react";
import { Link } from "react-router-dom";

import { StarRating } from "../../../../components/ui";
import { routeBuilders } from "../../../../routes/paths";
import { getFallbackHueStyle, getInitials } from "../../../../utils/colorFromString";
import {
  getUserDisplayName,
  resolveProfileImage,
} from "../../../profile/utils/profileDisplay";
import type { BookReview, ReviewVoteType } from "../../types/book";

export interface ReviewCardProps {
  review: BookReview;
  rating: number;
  canEdit?: boolean;
  isUpdating?: boolean;
  isVoting?: boolean;
  currentVote?: ReviewVoteType | null | undefined;
  onUpdate?: (reviewId: string | number, reviewText: string) => void;
  onVote?: (reviewId: string | number, voteType: ReviewVoteType) => void;
  onDeleteVote?: (reviewId: string | number) => void;
}

const compactNumberFormatter = new Intl.NumberFormat("en", {
  maximumFractionDigits: 1,
  notation: "compact",
});

function formatReviewDate(value?: string): string {
  if (!value) return "Unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatCompactCount(value: number): string {
  return compactNumberFormatter.format(value);
}

function ThumbIcon({ direction }: { direction: ReviewVoteType }): ReactElement {
  return (
    <svg
      className={`h-4 w-4 ${direction === "down" ? "rotate-180" : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 11v9H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h3Zm0 0 4.4-7.1a2 2 0 0 1 3.7 1.1v4h4.6a2 2 0 0 1 2 2.4l-1.2 6A3 3 0 0 1 17.6 20H7V11Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function ReviewCard({
  review,
  rating,
  canEdit = false,
  isUpdating = false,
  isVoting = false,
  currentVote = null,
  onUpdate,
  onVote,
  onDeleteVote,
}: ReviewCardProps): ReactElement {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(review.body);
  const [hasAvatarError, setHasAvatarError] = useState(false);
  const editFieldId = useId();
  const username = canEdit
    ? "You"
    : getUserDisplayName(review.user_detail ?? { id: review.user });
  const profileLabel = canEdit ? "View your profile" : `View ${username} profile`;
  const profileImage = resolveProfileImage(
    review.user_detail?.profile_picture ||
      review.user_detail?.profile_picture_fallback_url
  );
  const profilePath = routeBuilders.userProfile(review.user);
  const reviewDate = formatReviewDate(review.reviewed_at ?? review.created_at);
  const editedDate = formatReviewDate(
    review.edited_at ?? review.updated_at ?? review.reviewed_at ?? review.created_at
  );
  const trimmedDraft = draft.trim();
  const canSaveDraft =
    Boolean(trimmedDraft) && trimmedDraft !== review.body.trim() && !isUpdating;
  const helpfulCount = review.upvote_count ?? 0;
  const notHelpfulCount = review.downvote_count ?? 0;

  useEffect(() => {
    if (!isEditing) {
      setDraft(review.body);
    }
  }, [isEditing, review.body]);

  useEffect(() => {
    setHasAvatarError(false);
  }, [profileImage]);

  const handleVote = (voteType: ReviewVoteType): void => {
    if (currentVote === voteType) {
      onDeleteVote?.(review.id);
      return;
    }

    onVote?.(review.id, voteType);
  };
  const handleSave = (): void => {
    if (!canSaveDraft) return;

    onUpdate?.(review.id, trimmedDraft);
    setIsEditing(false);
  };
  const handleCancel = (): void => {
    setDraft(review.body);
    setIsEditing(false);
  };
  const canShowAvatar = Boolean(profileImage) && !hasAvatarError;
  const avatar = canShowAvatar ? (
    <img
      src={profileImage}
      className="h-full w-full object-cover"
      alt={`${username} avatar`}
      loading="lazy"
      decoding="async"
      onError={() => setHasAvatarError(true)}
    />
  ) : (
    <span
      className="fallback-gradient flex h-full w-full items-center justify-center text-sm font-bold text-primary-white"
      style={getFallbackHueStyle(username)}
    >
      {getInitials(username)}
    </span>
  );

  return (
    <article className="rounded-lg border border-[var(--surface-glass-border)] bg-[var(--surface-panel)] p-4 text-primary-white shadow-sm sm:p-5">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
        <div className="flex min-w-0 items-start gap-3">
          <div className="pt-0.5">
            {profilePath ? (
              <Link
                to={profilePath}
                className="flex h-12 w-12 shrink-0 overflow-hidden rounded-full bg-primary-gray"
                aria-label={profileLabel}
              >
                {avatar}
              </Link>
            ) : (
              <span className="flex h-12 w-12 shrink-0 overflow-hidden rounded-full bg-primary-gray">
                {avatar}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <strong className="truncate text-base">
                {profilePath ? (
                  <Link to={profilePath} className="hover:text-accent">
                    {username}
                  </Link>
                ) : (
                  username
                )}
              </strong>
              {canEdit ? (
                <span className="rounded-md border border-accent/50 bg-accent/15 px-2 py-0.5 text-[0.7rem] font-semibold text-accent">
                  Yours
                </span>
              ) : null}
              {review.contains_spoilers ? (
                <span className="rounded-md border border-warning/40 bg-warning/10 px-2 py-0.5 text-[0.7rem] font-semibold text-warning">
                  Spoilers
                </span>
              ) : null}
            </div>
            <span className="mt-1 block text-xs font-medium text-primary-gray">
              {reviewDate}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 md:justify-end">
          <span className="rounded-md border border-[var(--surface-glass-border)] bg-primary-white/5 px-2.5 py-1 text-xs font-semibold text-primary-white">
            {rating ? `${rating} / 5` : "No rating"}
          </span>
          <StarRating
            value={rating}
            size="sm"
            label={`Reader rating ${rating} out of 5`}
          />
        </div>
      </div>

      {isEditing ? (
        <div className="mt-4 flex flex-col gap-3">
          <label htmlFor={editFieldId} className="sr-only">
            {canEdit ? "Edit your review" : `Edit review by ${username}`}
          </label>
          <textarea
            id={editFieldId}
            className="field min-h-40 resize-y rounded-lg border border-[var(--surface-glass-border)] bg-primary-black/35 text-primary-white placeholder:text-primary-gray focus:border-accent focus:bg-primary-black/50"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            aria-describedby={`${editFieldId}-count`}
          />
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p id={`${editFieldId}-count`} className="text-xs font-semibold text-primary-gray">
              {draft.length.toLocaleString()} characters
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-primary-gray hover:bg-primary-white/10 hover:text-primary-white"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center rounded-lg px-5 py-2 text-sm text-primary-white"
                disabled={!canSaveDraft}
                onClick={handleSave}
              >
                {isUpdating ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          {review.title ? (
            <h3 className="text-lg font-semibold text-primary-white">
              {review.title}
            </h3>
          ) : null}
          <p className="whitespace-pre-wrap text-sm leading-7 text-primary-gray sm:text-[0.95rem]">
            {review.body}
          </p>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 border-t border-[var(--surface-glass-border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-h-5 text-xs font-semibold text-primary-gray">
          {review.is_edited ? <span>Edited {editedDate}</span> : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {canEdit ? (
            <button
              type="button"
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-transparent px-3 py-2 text-sm font-semibold text-primary-white hover:border-[var(--surface-glass-border)] hover:bg-primary-white/10"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </button>
          ) : null}
          <button
            type="button"
            className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${currentVote === "up" ? "border-accent bg-accent text-accent-contrast shadow-sm" : "border-[var(--surface-glass-border)] bg-primary-white/5 text-primary-white hover:bg-primary-white/10"}`}
            aria-pressed={currentVote === "up"}
            aria-label={`Mark as helpful. ${helpfulCount} helpful votes`}
            disabled={isVoting}
            onClick={() => handleVote("up")}
          >
            <ThumbIcon direction="up" />
            <span>Helpful</span>
            <span className="rounded-md bg-primary-black/30 px-1.5 py-0.5 text-[0.7rem]">
              {formatCompactCount(helpfulCount)}
            </span>
          </button>
          <button
            type="button"
            className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${currentVote === "down" ? "border-secondary-gray bg-secondary-black text-primary-white shadow-sm" : "border-[var(--surface-glass-border)] bg-primary-white/5 text-primary-white hover:bg-primary-white/10"}`}
            aria-pressed={currentVote === "down"}
            aria-label={`Mark as not helpful. ${notHelpfulCount} not helpful votes`}
            disabled={isVoting}
            onClick={() => handleVote("down")}
          >
            <ThumbIcon direction="down" />
            <span>Not helpful</span>
            <span className="rounded-md bg-primary-black/30 px-1.5 py-0.5 text-[0.7rem]">
              {formatCompactCount(notHelpfulCount)}
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}
