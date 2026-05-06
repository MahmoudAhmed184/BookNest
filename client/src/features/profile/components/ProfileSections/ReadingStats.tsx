import type { ReactElement } from "react";

export interface ReadingStatsProps {
  bookCount: number;
  reviewCount: number;
  ratingCount: number;
  pagesRead?: number | undefined;
  favoriteGenre?: string | undefined;
  currentStreak?: number | undefined;
}

export function ReadingStats({
  bookCount,
  reviewCount,
  ratingCount,
  pagesRead,
  favoriteGenre = "Curious",
  currentStreak,
}: ReadingStatsProps): ReactElement {
  const streakValue = currentStreak ?? Math.min(30, reviewCount + ratingCount);
  const stats = [
    { id: "books", value: bookCount, label: "Books read" },
    { id: "pages", value: pagesRead ?? bookCount * 280, label: "Pages read" },
    { id: "genre", value: favoriteGenre, label: "Favorite genre" },
    { id: "streak", value: `${streakValue}d`, label: "Current streak" },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Reading stats">
      {stats.map((stat) => (
        <div
          key={stat.id}
          className="glass-card min-w-0 p-4 sm:p-5"
        >
          <p className="truncate text-2xl font-extrabold leading-tight text-primary-white sm:text-3xl">{stat.value}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-primary-gray">{stat.label}</p>
        </div>
      ))}
    </section>
  );
}
