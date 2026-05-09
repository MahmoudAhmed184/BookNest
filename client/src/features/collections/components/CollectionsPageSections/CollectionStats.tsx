import type { ReactElement } from "react";

import type { CollectionStats as CollectionStatsValue } from "../../utils/collectionPresentation";

interface CollectionStatsProps {
  stats: CollectionStatsValue;
}

export function CollectionStats({ stats }: CollectionStatsProps): ReactElement {
  const statItems = [
    {
      label: "Collections",
      value: stats.totalCollections,
      tone: "border-accent/30 bg-accent/10 text-accent",
    },
    {
      label: "Books saved",
      value: stats.totalBooks,
      tone: "border-info/30 bg-info/10 text-info",
    },
    {
      label: "Reading now",
      value: stats.activeCollections,
      tone: "border-warning/30 bg-warning/10 text-warning",
    },
    {
      label: "Public",
      value: stats.publicCollections,
      tone: "border-success/30 bg-success/10 text-success",
    },
  ] as const;

  return (
    <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {statItems.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-[var(--surface-glass-border)] bg-secondary-black/45 p-4 shadow-sm backdrop-blur"
        >
          <dt className="text-xs font-bold uppercase text-primary-gray">
            {item.label}
          </dt>
          <dd className="mt-3 flex items-end justify-between gap-3">
            <span className="text-3xl font-black leading-none text-primary-white">
              {item.value.toLocaleString()}
            </span>
            <span
              className={`h-2.5 w-2.5 rounded-full border ${item.tone}`}
              aria-hidden="true"
            />
          </dd>
        </div>
      ))}
    </dl>
  );
}
