import type { ReactElement } from "react";

import { formatCompactNumber } from "../../utils/profileDisplay";

export interface ReadingStatsProps {
  bookCount: number;
  reviewCount: number;
  ratingCount: number;
  collectionCount?: number | undefined;
  pagesRead?: number | undefined;
  favoriteGenre?: string | undefined;
  currentStreak?: number | undefined;
}

type ReadingStatIconName = "book" | "collection" | "genre" | "pages" | "review" | "star";

interface ReadingStatIconProps {
  name: ReadingStatIconName;
}

interface ReadingStatItem {
  id: string;
  value: string;
  label: string;
  detail: string;
  icon: ReadingStatIconName;
}

function ReadingStatIcon({ name }: ReadingStatIconProps): ReactElement {
  const commonProps = {
    className: "h-5 w-5",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  };

  if (name === "collection") {
    return (
      <svg {...commonProps}>
        <path d="M5 6h14M5 12h14M5 18h14" />
      </svg>
    );
  }

  if (name === "genre") {
    return (
      <svg {...commonProps}>
        <path d="M12 3c4.5 0 8 3 8 7.2 0 5.2-5.1 8.9-8 10.8-2.9-1.9-8-5.6-8-10.8C4 6 7.5 3 12 3Z" />
        <path d="M9 10h6M9 14h4" />
      </svg>
    );
  }

  if (name === "pages") {
    return (
      <svg {...commonProps}>
        <path d="M8 3h8l4 4v14H8z" />
        <path d="M16 3v5h5M4 7v14" />
      </svg>
    );
  }

  if (name === "review") {
    return (
      <svg {...commonProps}>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
      </svg>
    );
  }

  if (name === "star") {
    return (
      <svg {...commonProps}>
        <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9L12 3Z" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15Z" />
    </svg>
  );
}

export function ReadingStats({
  bookCount,
  reviewCount,
  ratingCount,
  collectionCount = 0,
  pagesRead,
  favoriteGenre = "Curious",
  currentStreak,
}: ReadingStatsProps): ReactElement {
  const estimatedPages = pagesRead ?? bookCount * 280;
  const streakValue = currentStreak ?? Math.min(30, reviewCount + ratingCount);
  const stats: ReadingStatItem[] = [
    {
      id: "books",
      value: formatCompactNumber(bookCount),
      label: "Books read",
      detail: `${formatCompactNumber(estimatedPages)} estimated pages`,
      icon: "book",
    },
    {
      id: "reviews",
      value: formatCompactNumber(reviewCount),
      label: "Reviews",
      detail: `${formatCompactNumber(ratingCount)} ratings logged`,
      icon: "review",
    },
    {
      id: "collections",
      value: formatCompactNumber(collectionCount),
      label: "Collections",
      detail: collectionCount === 1 ? "Curated shelf" : "Curated shelves",
      icon: "collection",
    },
    {
      id: "genre",
      value: favoriteGenre,
      label: "Favorite genre",
      detail: `${streakValue} day reading rhythm`,
      icon: "genre",
    },
  ];

  return (
    <section className="flex flex-col gap-4" aria-labelledby="reading-snapshot-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-accent">Reading signal</p>
          <h2 id="reading-snapshot-title" className="text-2xl font-bold text-primary-white">
            Reading snapshot
          </h2>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article
            key={stat.id}
            className="min-w-0 rounded-lg border border-[var(--surface-glass-border)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--surface-panel)_88%,transparent),color-mix(in_srgb,var(--surface-panel-strong)_72%,transparent))] p-4 shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-2xl font-extrabold leading-tight text-primary-white sm:text-3xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase text-primary-gray">
                  {stat.label}
                </p>
              </div>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-accent/25 bg-accent/10 text-accent">
                <ReadingStatIcon name={stat.icon} />
              </span>
            </div>
            <p className="mt-4 truncate text-sm text-primary-gray">{stat.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
