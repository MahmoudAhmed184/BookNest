import { useState, type ReactElement } from "react";
import { Link } from "react-router-dom";

import { MoodBadge, StarRating } from "../../../../components/ui";
import { routeBuilders } from "../../../../routes/paths";
import { getFallbackHueStyle, getInitials, colorFromString } from "../../../../utils/colorFromString";
import { moodColorTokens, moodOptions } from "../../data/moodColors";
import type { BookReview } from "../../types/book";
import type { MoodTag } from "../../types/filters";

export interface ReviewCardProps {
  review: BookReview;
  rating: number;
  mood: MoodTag;
}

function resolveProfileImage(src?: string | null): string | undefined {
  if (!src) return undefined;
  return src.endsWith("image") ? `${src}.svg` : src;
}

export function getReviewMood(review: BookReview): MoodTag {
  const seed = colorFromString(`${review.review_text} ${review.book_title ?? ""}`);
  return moodOptions[seed % moodOptions.length]?.value ?? "hopeful";
}

export function ReviewCard({ review, rating, mood }: ReviewCardProps): ReactElement {
  const [isHelpful, setIsHelpful] = useState(false);
  const username = review.username || "Reader";
  const profileImage = resolveProfileImage(review.profile_pic);

  return (
    <article className="glass-card card-lift p-4 text-primary-white">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={routeBuilders.userProfile(review.profile_id)}
            className="h-11 w-11 overflow-hidden rounded-xl bg-primary-gray"
            aria-label={`View ${username} profile`}
          >
            {profileImage ? (
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
            )}
          </Link>
          <strong>
            <Link to={routeBuilders.userProfile(review.profile_id)} className="hover:text-accent">
              {username}
            </Link>
          </strong>
        </div>
        <StarRating value={rating} size="sm" label={`Reader rating ${rating} out of 5`} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <MoodBadge label={mood} colorToken={moodColorTokens[mood]} />
      </div>
      <p className="mt-4 text-sm leading-relaxed text-primary-white">{review.review_text}</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-primary-gray">
        <span>{review.created_at}</span>
        <button
          type="button"
          className="min-h-[44px] rounded-full px-3 py-2 font-semibold text-primary-white hover:bg-primary-black"
          aria-pressed={isHelpful}
          onClick={() => setIsHelpful((current) => !current)}
        >
          {isHelpful ? "Helpful" : "Mark helpful"}
        </button>
      </div>
    </article>
  );
}
