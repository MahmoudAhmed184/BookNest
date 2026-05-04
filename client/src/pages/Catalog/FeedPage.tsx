import { useState, type ReactElement } from "react";
import { Link } from "react-router-dom";

import EmptyState from "../../components/EmptyState";

function getInitials(value: string): string {
  return (
    value
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "BN"
  );
}

function ActivityCover({
  src,
  title,
}: {
  src: string;
  title: string;
}): ReactElement {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div className="flex aspect-[2/3] h-[120px] w-[80px] shrink-0 items-center justify-center rounded-xl bg-secondary-gray px-2 text-center text-lg font-semibold text-primary-white">
        <span aria-hidden="true">{getInitials(title)}</span>
        <span className="sr-only">Cover unavailable for {title}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`Cover of ${title}`}
      className="aspect-[2/3] h-[120px] w-[80px] shrink-0 rounded-xl object-cover shadow-md transition-transform duration-200 ease-out in-hover:-translate-y-1"
      width="80"
      height="120"
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

export default function PublicFeed() {
  const actions = [
    {
      id: 1,
      username: "Mosab",
      action: "started reading",
      timestamp: "Just now",
      book: {
        id: 1,
        title: "Harry Potter: The Prisoner of Azkaban",
        cover:
          "https://oku.ams3.cdn.digitaloceanspaces.com/covers/2022/08/3862d6e1202f427c0be0ca9ec891be82.jpg",
      },
    },
    {
      id: 2,
      username: "Alice",
      action: "wants to read",
      timestamp: "12 min ago",
      book: {
        id: 2,
        title: "To Kill a Mockingbird",
        cover:
          "https://oku.ams3.cdn.digitaloceanspaces.com/covers/2022/06/cf9c878d81fcf26ceaa350cbf77aa1f5.jpg",
      },
    },
    {
      id: 3,
      username: "Bob",
      action: "started reading",
      timestamp: "25 min ago",
      book: {
        id: 3,
        title: "1984",
        cover:
          "https://oku.ams3.cdn.digitaloceanspaces.com/covers/2022/06/0be61269e4fc87209ac3e2a2ecab4abd.jpg",
      },
    },
    {
      id: 4,
      username: "Sarah",
      action: "wants to read",
      timestamp: "42 min ago",
      book: {
        id: 4,
        title: "Pride and Prejudice",
        cover:
          "https://oku.ams3.cdn.digitaloceanspaces.com/covers/2022/08/3862d6e1202f427c0be0ca9ec891be82.jpg",
      },
    },
    {
      id: 5,
      username: "John",
      action: "started reading",
      timestamp: "1 hr ago",
      book: {
        id: 5,
        title: "The Great Gatsby",
        cover:
          "https://oku.ams3.cdn.digitaloceanspaces.com/covers/2022/06/cf9c878d81fcf26ceaa350cbf77aa1f5.jpg",
      },
    },
    {
      id: 6,
      username: "Emma",
      action: "wants to read",
      timestamp: "2 hrs ago",
      book: {
        id: 6,
        title: "Dune",
        cover:
          "https://oku.ams3.cdn.digitaloceanspaces.com/covers/2022/06/0be61269e4fc87209ac3e2a2ecab4abd.jpg",
      },
    },
    {
      id: 7,
      username: "Mike",
      action: "started reading",
      timestamp: "3 hrs ago",
      book: {
        id: 7,
        title: "The Da Vinci Code",
        cover:
          "https://oku.ams3.cdn.digitaloceanspaces.com/covers/2022/08/3862d6e1202f427c0be0ca9ec891be82.jpg",
      },
    },
    {
      id: 8,
      username: "Lisa",
      action: "wants to read",
      timestamp: "4 hrs ago",
      book: {
        id: 8,
        title: "Gone Girl",
        cover:
          "https://oku.ams3.cdn.digitaloceanspaces.com/covers/2022/06/cf9c878d81fcf26ceaa350cbf77aa1f5.jpg",
      },
    },
    {
      id: 9,
      username: "Tom",
      action: "started reading",
      timestamp: "Yesterday",
      book: {
        id: 9,
        title: "The Girl with the Dragon Tattoo",
        cover:
          "https://oku.ams3.cdn.digitaloceanspaces.com/covers/2022/06/0be61269e4fc87209ac3e2a2ecab4abd.jpg",
      },
    },
    {
      id: 10,
      username: "Sophie",
      action: "wants to read",
      timestamp: "Yesterday",
      book: {
        id: 1,
        title: "Harry Potter: The Prisoner of Azkaban",
        cover:
          "https://oku.ams3.cdn.digitaloceanspaces.com/covers/2022/08/3862d6e1202f427c0be0ca9ec891be82.jpg",
      },
    },
  ];

  return (
    <div className="py-12 flex flex-col gap-8 animate-fade-up">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold text-primary-white text-balance">
          Public Feed
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-primary-gray">
          See what readers are picking up across BookNest.
        </p>
      </header>

      {actions.length === 0 ? (
        <EmptyState
          title="You're all caught up!"
          description="New reading activity will show up here when readers share updates."
          actionLabel="Explore books"
          actionTo="/explore"
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {actions.map((activity) => (
            <Link
              key={activity.id}
              to={`/book/${activity.book.id}`}
              className="group grid grid-cols-[1fr_auto] items-center gap-4 rounded-xl bg-secondary-black p-4 text-primary-white shadow-md transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-xl [will-change:transform]"
              aria-label={`${activity.username} ${activity.action} ${activity.book.title}`}
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-black text-sm font-semibold text-primary-white">
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
      )}
    </div>
  );
}
