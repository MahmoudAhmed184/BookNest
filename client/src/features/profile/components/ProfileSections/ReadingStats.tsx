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
    <section className="bento-grid" aria-label="Reading stats">
      {stats.map((stat, position) => (
        <div
          key={stat.id}
          className={`glass-card card-lift p-5 ${position === 0 ? "md:col-span-2" : ""}`}
        >
          <p className="text-3xl font-extrabold text-primary-white">{stat.value}</p>
          <p className="mt-1 text-xs uppercase text-primary-gray">{stat.label}</p>
        </div>
      ))}
    </section>
  );
}
