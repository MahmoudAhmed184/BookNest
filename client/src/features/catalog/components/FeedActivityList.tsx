import { useState, type ReactElement } from "react";
import { Link } from "react-router-dom";

import { StarRating } from "../../../components/ui";
import { routeBuilders } from "../../../routes/paths";
import { getFallbackHueStyle, getInitials } from "../../../utils/colorFromString";
import type { Book, FeedEvent } from "../types/book";
import { getAuthorNames, getBookGenres } from "../utils/bookFacets";

type EventIconName = "activity" | "follow" | "list" | "review" | "shelf" | "star";

interface EventPresentation {
  badge: string;
  icon: EventIconName;
  label: string;
  verb: string;
}

interface ActivityCoverProps {
  priority?: boolean | undefined;
  src?: string | null | undefined;
  title: string;
}

interface EventIconProps {
  name: EventIconName;
  className?: string | undefined;
}

interface FeedActivityListProps {
  activities: FeedEvent[];
}

const compactFormatter = new Intl.NumberFormat("en", {
  maximumFractionDigits: 1,
  notation: "compact",
});
const relativeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const eventPresentations: Record<string, EventPresentation> = {
  rating_created: {
    badge: "border-warning/30 bg-warning/15 text-warning",
    icon: "star",
    label: "Rating",
    verb: "rated",
  },
  review_created: {
    badge: "border-info/30 bg-info/15 text-info",
    icon: "review",
    label: "Review",
    verb: "reviewed",
  },
  book_added: {
    badge: "border-success/30 bg-success/15 text-success",
    icon: "shelf",
    label: "Shelf",
    verb: "shelved",
  },
  collection_created: {
    badge: "border-accent/30 bg-accent/15 text-accent",
    icon: "list",
    label: "List",
    verb: "created",
  },
  user_followed: {
    badge: "border-[var(--surface-glass-border)] bg-secondary-black text-primary-gray",
    icon: "follow",
    label: "Follow",
    verb: "followed",
  },
};

const fallbackPresentation: EventPresentation = {
  badge: "border-[var(--surface-glass-border)] bg-secondary-black text-primary-gray",
  icon: "activity",
  label: "Activity",
  verb: "shared",
};

function EventIcon({ name, className = "h-4 w-4" }: EventIconProps): ReactElement {
  if (name === "star") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
        <path d="m12 2.75 2.84 5.75 6.35.92-4.6 4.48 1.08 6.32L12 17.23l-5.67 2.99L7.4 13.9 2.8 9.42l6.36-.92L12 2.75Z" />
      </svg>
    );
  }

  if (name === "review") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
        <path d="M5 5.75A2.75 2.75 0 0 1 7.75 3h8.5A2.75 2.75 0 0 1 19 5.75v7.5A2.75 2.75 0 0 1 16.25 16H10l-4.2 3.15A.5.5 0 0 1 5 18.75v-13Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M8.5 7.5h7M8.5 10.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "shelf" || name === "list") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
        <path d="M6 4.75A1.75 1.75 0 0 1 7.75 3h8.5A1.75 1.75 0 0 1 18 4.75v14.5c0 .42-.48.66-.82.41L12 15.8l-5.18 3.86a.5.5 0 0 1-.82-.4V4.75Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        {name === "list" ? <path d="M9 7h6M9 10h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /> : null}
      </svg>
    );
  }

  if (name === "follow") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
        <path d="M9.5 11.5a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5ZM4 20a5.5 5.5 0 0 1 11 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M18 7v6M15 10h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M12 3.5v17M3.5 12h17M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function presentationFor(activity: FeedEvent): EventPresentation {
  return eventPresentations[activity.event_type] ?? fallbackPresentation;
}

function actorName(activity: FeedEvent): string {
  const actor = activity.actor_detail;
  const fullName = [actor?.first_name, actor?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return actor?.display_name || fullName || actor?.email || `Reader ${activity.actor}`;
}

function readableLabel(value: string | null | undefined): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  const ownerPrefixedLabel = trimmed.match(/^\d+:(.+)$/);
  return ownerPrefixedLabel?.[1]?.trim() || trimmed;
}

function numericValue(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function payloadString(payload: FeedEvent["payload"], keys: string[]): string | null {
  for (const key of keys) {
    const value = payload?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return null;
}

function plainText(value: string | undefined): string {
  return value?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() ?? "";
}

function truncate(value: string, length: number): string {
  return value.length <= length ? value : `${value.slice(0, length - 1).trim()}...`;
}

function relativeTime(value: string | undefined): string {
  if (!value) return "just now";

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "just now";

  const seconds = Math.round((timestamp - Date.now()) / 1000);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];

  for (const [unit, amount] of units) {
    if (Math.abs(seconds) >= amount) {
      return relativeFormatter.format(Math.round(seconds / amount), unit);
    }
  }

  return relativeFormatter.format(seconds, "second");
}

function formatCountLabel(count: number | undefined, noun: string): string | null {
  if (!count) return null;
  return `${compactFormatter.format(count)} ${noun}${count === 1 ? "" : "s"}`;
}

function activityTarget(activity: FeedEvent): string {
  const title = activity.book_detail?.title;
  const targetLabel = readableLabel(activity.target_label);
  const actionLabel = readableLabel(activity.action_object_label);

  return title || targetLabel || actionLabel || "a reading update";
}

function ActivityCover({ priority = false, src, title }: ActivityCoverProps): ReactElement {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className="fallback-gradient flex aspect-[2/3] h-36 w-24 shrink-0 items-center justify-center rounded-xl px-3 text-center text-xl font-bold text-primary-white shadow-md"
        style={getFallbackHueStyle(title)}
      >
        <span aria-hidden="true">{getInitials(title)}</span>
        <span className="sr-only">Cover unavailable for {title}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`Cover of ${title}`}
      className="aspect-[2/3] h-36 w-24 shrink-0 rounded-xl object-cover shadow-md transition-transform duration-200 ease-out group-hover/card:-translate-y-1"
      width="96"
      height="144"
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

function ActivityAvatar({ name }: { name: string }): ReactElement {
  return (
    <div
      className="fallback-gradient flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-primary-white shadow-md"
      style={getFallbackHueStyle(name)}
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  );
}

function BookActivitySummary({
  activity,
  book,
  priority,
}: {
  activity: FeedEvent;
  book: Book;
  priority: boolean;
}): ReactElement {
  const averageRating = numericValue(book.average_rating);
  const eventRating = numericValue(activity.payload?.rating);
  const genres = getBookGenres(book).slice(0, 2);
  const reviewSnippet = payloadString(activity.payload, ["review", "body", "excerpt"]);
  const description = reviewSnippet || plainText(book.description);
  const supportingText = description ? truncate(description, 220) : null;
  const ratingCount = formatCountLabel(book.rating_count, "rating");
  const reviewCount = formatCountLabel(book.review_count, "review");

  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-[6rem_minmax(0,1fr)]">
      <Link
        to={routeBuilders.book(book.id)}
        className="w-fit rounded-xl focus-visible:outline-accent"
        aria-label={`Open ${book.title}`}
      >
        <ActivityCover
          priority={priority}
          src={book.cover || book.cover_fallback_url}
          title={book.title}
        />
      </Link>
      <div className="min-w-0">
        <Link to={routeBuilders.book(book.id)} className="group/title rounded-lg">
          <h2 className="font-display text-2xl font-bold leading-tight text-primary-white transition-colors group-hover/title:text-accent text-balance">
            {book.title}
          </h2>
        </Link>
        <p className="mt-1 text-sm leading-relaxed text-primary-gray">
          {getAuthorNames(book) || "Unknown author"}
        </p>
        {eventRating ? (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <StarRating
              value={eventRating}
              size="sm"
              readOnly
              label={`Reader rating: ${eventRating} out of 5`}
            />
            <span className="text-xs font-semibold text-primary-gray">
              {eventRating.toFixed(1)} out of 5
            </span>
          </div>
        ) : null}
        {supportingText ? (
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-primary-gray">
            {supportingText}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {genres.map((genre, index) => (
            <span
              key={`${genre}-${index}`}
              className="inline-flex min-h-7 items-center rounded-lg border border-[var(--surface-glass-border)] bg-secondary-black/70 px-3 text-xs font-semibold text-primary-gray"
            >
              {genre}
            </span>
          ))}
          {book.publication_year ? (
            <span className="inline-flex min-h-7 items-center rounded-lg border border-[var(--surface-glass-border)] px-3 text-xs font-semibold text-primary-gray">
              {book.publication_year}
            </span>
          ) : null}
          {averageRating ? (
            <span className="inline-flex min-h-7 items-center gap-1 rounded-lg border border-[var(--surface-glass-border)] px-3 text-xs font-semibold text-primary-gray">
              <EventIcon name="star" className="h-3.5 w-3.5 text-accent" />
              {averageRating.toFixed(1)}
            </span>
          ) : null}
          {reviewCount ? (
            <span className="inline-flex min-h-7 items-center rounded-lg border border-[var(--surface-glass-border)] px-3 text-xs font-semibold text-primary-gray">
              {reviewCount}
            </span>
          ) : null}
          {ratingCount && !reviewCount ? (
            <span className="inline-flex min-h-7 items-center rounded-lg border border-[var(--surface-glass-border)] px-3 text-xs font-semibold text-primary-gray">
              {ratingCount}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function FeedActivityCard({
  activity,
  priority,
}: {
  activity: FeedEvent;
  priority: boolean;
}): ReactElement {
  const book = activity.book_detail;
  const actor = actorName(activity);
  const target = activityTarget(activity);
  const targetLabel = readableLabel(activity.target_label);
  const presentation = presentationFor(activity);
  const occurredAt = relativeTime(activity.occurred_at ?? activity.created_at);
  const visibility = activity.visibility?.replaceAll("_", " ");
  const showVisibility = visibility && visibility !== "public";

  return (
    <article className="glass-card card-lift group/card overflow-hidden p-4 text-primary-white sm:p-5">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-4">
        <Link
          to={routeBuilders.userProfile(activity.actor)}
          className="h-12 w-12 rounded-xl"
          aria-label={`Open ${actor}'s profile`}
        >
          <ActivityAvatar name={actor} />
        </Link>
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm leading-relaxed text-primary-gray">
                <Link
                  to={routeBuilders.userProfile(activity.actor)}
                  className="font-semibold text-primary-white hover:text-accent"
                >
                  {actor}
                </Link>{" "}
                {presentation.verb}{" "}
                {book ? (
                  <Link
                    to={routeBuilders.book(book.id)}
                    className="font-semibold text-primary-white hover:text-accent"
                  >
                    {book.title}
                  </Link>
                ) : (
                  <span className="font-semibold text-primary-white">{target}</span>
                )}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-primary-gray">
                <span>{occurredAt}</span>
                <span className={`inline-flex min-h-7 items-center gap-1.5 rounded-lg border px-3 font-semibold ${presentation.badge}`}>
                  <EventIcon name={presentation.icon} className="h-3.5 w-3.5" />
                  {presentation.label}
                </span>
                {showVisibility ? (
                  <span className="inline-flex min-h-7 items-center rounded-lg border border-[var(--surface-glass-border)] px-3 font-semibold capitalize">
                    {visibility}
                  </span>
                ) : null}
              </div>
            </div>
            <span
              className={`hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl border sm:flex ${presentation.badge}`}
              aria-hidden="true"
            >
              <EventIcon name={presentation.icon} className="h-5 w-5" />
            </span>
          </div>

          {book ? (
            <BookActivitySummary activity={activity} book={book} priority={priority} />
          ) : (
            <div className="mt-5 rounded-xl border border-[var(--surface-glass-border)] bg-secondary-black/70 p-4">
              <p className="text-sm font-semibold text-primary-white">{target}</p>
              {targetLabel && targetLabel !== target ? (
                <p className="mt-1 text-sm leading-relaxed text-primary-gray">{targetLabel}</p>
              ) : null}
            </div>
          )}

          <footer className="mt-5 flex flex-wrap items-center gap-3 border-t border-[var(--surface-glass-border)] pt-4">
            {book ? (
              <Link
                to={routeBuilders.book(book.id)}
                className="btn btn-primary-v inline-flex min-h-[44px] items-center justify-center px-4 py-2 text-sm"
              >
                Open book
              </Link>
            ) : null}
            {activity.event_type === "book_added" && targetLabel ? (
              <span className="text-xs text-primary-gray">In {targetLabel}</span>
            ) : null}
          </footer>
        </div>
      </div>
    </article>
  );
}

export function FeedActivityList({
  activities,
}: FeedActivityListProps): ReactElement {
  return (
    <div className="flex flex-col gap-5">
      {activities.map((activity, index) => (
        <FeedActivityCard
          key={activity.id}
          activity={activity}
          priority={index < 2}
        />
      ))}
    </div>
  );
}
