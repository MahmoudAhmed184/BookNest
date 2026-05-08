import { useState, type ReactElement } from "react";
import { Link } from "react-router-dom";

import { StarRating } from "../../../../components/ui";
import { routeBuilders } from "../../../../routes/paths";
import { getFallbackHueStyle, getInitials } from "../../../../utils/colorFromString";
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

function resolveProfileImage(src?: string | null): string | undefined {
  if (!src) return undefined;
  return src.endsWith("image") ? `${src}.svg` : src;
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
  const username = review.book_detail ? `Reader ${review.user}` : `Reader ${review.user}`;
  const profileImage = resolveProfileImage(undefined);
  const profilePath = routeBuilders.userProfile(review.user);
  const handleVote = (voteType: ReviewVoteType): void => {
    if (currentVote === voteType) {
      onDeleteVote?.(review.id);
      return;
    }

    onVote?.(review.id, voteType);
  };
  const avatar = profileImage ? (
    <img
      src={profileImage}
      className="h-full w-full object-cover"
      alt={`${username} avatar`}
      loading="lazy"
      decoding="async"
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
    <article className="glass-card card-lift p-4 text-primary-white">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          {profilePath ? (
            <Link
              to={profilePath}
              className="h-11 w-11 overflow-hidden rounded-xl bg-primary-gray"
              aria-label={`View ${username} profile`}
            >
              {avatar}
            </Link>
          ) : (
            <span className="h-11 w-11 overflow-hidden rounded-xl bg-primary-gray">
              {avatar}
            </span>
          )}
          <strong>
            {profilePath ? (
              <Link to={profilePath} className="hover:text-accent">
                {username}
              </Link>
            ) : (
              username
            )}
          </strong>
        </div>
        <StarRating value={rating} size="sm" label={`Reader rating ${rating} out of 5`} />
      </div>
      {isEditing ? (
        <div className="mt-4 flex flex-col gap-3">
          <textarea
            className="field min-h-28 resize-y text-primary-white"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            aria-label={`Edit review by ${username}`}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-accent-v min-h-[44px] px-4 py-2 text-sm text-primary-white"
              disabled={isUpdating || !draft.trim()}
              onClick={() => {
                onUpdate?.(review.id, draft.trim());
                setIsEditing(false);
              }}
            >
              {isUpdating ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              className="min-h-[44px] rounded-full px-4 py-2 text-sm font-semibold text-primary-gray hover:bg-primary-black hover:text-primary-white"
              onClick={() => {
                setDraft(review.body);
                setIsEditing(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm leading-relaxed text-primary-white">{review.body}</p>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-primary-gray">
        <span>{review.reviewed_at ?? review.created_at}</span>
        <div className="flex flex-wrap gap-2">
          {canEdit ? (
            <button
              type="button"
              className="min-h-[44px] rounded-full px-3 py-2 font-semibold text-primary-white hover:bg-primary-black"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </button>
          ) : null}
          <button
            type="button"
            className="min-h-[44px] rounded-full px-3 py-2 font-semibold text-primary-white hover:bg-primary-black"
            aria-pressed={currentVote === "up"}
            disabled={isVoting}
            onClick={() => handleVote("up")}
          >
            Helpful {review.upvote_count ? `(${review.upvote_count})` : ""}
          </button>
          <button
            type="button"
            className="min-h-[44px] rounded-full px-3 py-2 font-semibold text-primary-white hover:bg-primary-black"
            aria-pressed={currentVote === "down"}
            disabled={isVoting}
            onClick={() => handleVote("down")}
          >
            Not helpful {review.downvote_count ? `(${review.downvote_count})` : ""}
          </button>
        </div>
      </div>
    </article>
  );
}
