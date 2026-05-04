import { useState, type ReactElement } from "react";
import { Link } from "react-router-dom";

import { routeBuilders } from "../../../routes/paths";
import { getFallbackHueStyle, getInitials } from "../../../utils/colorFromString";
import type { FeedActivity } from "../data/feedData";

interface ActivityCoverProps {
  src: string;
  title: string;
}

function ActivityCover({ src, title }: ActivityCoverProps): ReactElement {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className="fallback-gradient flex aspect-[2/3] h-[120px] w-[80px] shrink-0 items-center justify-center rounded-xl px-2 text-center text-lg font-bold text-primary-white"
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
      className="aspect-[2/3] h-[120px] w-[80px] shrink-0 rounded-xl object-cover shadow-md transition-transform duration-200 ease-out group-hover:-translate-y-1"
      width="80"
      height="120"
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

interface FeedActivityListProps {
  activities: FeedActivity[];
}

export function FeedActivityList({
  activities,
}: FeedActivityListProps): ReactElement {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {activities.map((activity) => (
        <Link
          key={activity.id}
          to={routeBuilders.book(activity.book.id)}
          className="glass-card card-lift group grid grid-cols-[1fr_auto] items-center gap-4 p-4 text-primary-white"
          aria-label={`${activity.username} ${activity.action} ${activity.book.title}`}
        >
          <div className="flex min-w-0 items-center gap-4">
            <div
              className="fallback-gradient flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-primary-white"
              style={getFallbackHueStyle(activity.username)}
            >
              {getInitials(activity.username)}
            </div>
            <div className="min-w-0">
              <p className="text-sm leading-relaxed text-primary-gray">
                <span className="font-semibold text-primary-white">
                  {activity.username}
                </span>{" "}
                {activity.action}
              </p>
              <p
                className="line-clamp-2 text-base font-semibold text-primary-white transition-colors duration-200 ease-out group-hover:text-accent"
                title={activity.book.title}
              >
                {activity.book.title}
              </p>
              <p className="mt-2 text-xs text-primary-gray">
                {activity.timestamp}
              </p>
            </div>
          </div>
          <ActivityCover src={activity.book.cover} title={activity.book.title} />
        </Link>
      ))}
    </div>
  );
}
