import type { ReactElement } from "react";
import { Link } from "react-router-dom";

import { routeBuilders, routePaths } from "../../../../routes/paths";
import type { ReadingCollection } from "../../../collections/types/collection";
import { formatCompactNumber } from "../../utils/profileDisplay";

export interface CollectionsShelfProps {
  collections?: ReadingCollection[] | undefined;
  canOpenCollections?: boolean | undefined;
}

interface CollectionCardProps {
  collection: ReadingCollection;
  canOpenCollections: boolean;
}

function CollectionCard({
  collection,
  canOpenCollections,
}: CollectionCardProps): ReactElement {
  const covers = (collection.items ?? [])
    .map((item) => item.book_detail?.cover || item.book_detail?.cover_fallback_url)
    .filter((cover): cover is string => Boolean(cover))
    .slice(0, 4);
  const bookCount = collection.item_count ?? collection.items?.length ?? 0;
  const isPrivate = collection.privacy === "private";
  const card = (
    <article className="group h-full min-w-0 rounded-lg border border-[var(--surface-glass-border)] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--surface-panel)_88%,transparent),color-mix(in_srgb,var(--surface-panel-strong)_72%,transparent))] p-4 shadow-md transition duration-200 ease-out hover:-translate-y-1 hover:shadow-lg">
      <div className="flex h-32 items-end gap-2 overflow-hidden rounded-lg bg-primary-black/50 p-3">
        {covers.length > 0 ? (
          covers.map((cover, index) => (
            <div
              key={`${cover}-${index}`}
              className={`w-14 shrink-0 overflow-hidden rounded-md bg-secondary-black shadow-lg ${
                index % 2 === 0 ? "h-24" : "h-28"
              }`}
            >
              <img
                src={cover}
                alt=""
                className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
                loading="lazy"
                decoding="async"
              />
            </div>
          ))
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-md border border-dashed border-[var(--surface-glass-border)] text-sm font-semibold text-primary-gray">
            Empty shelf
          </div>
        )}
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-1 text-lg font-bold text-primary-white" title={collection.name}>
            {collection.name}
          </h3>
          {collection.description ? (
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-primary-gray">
              {collection.description}
            </p>
          ) : null}
        </div>
        <span className="shrink-0 rounded-lg border border-[var(--surface-glass-border)] px-2.5 py-1 text-xs font-bold text-accent">
          {formatCompactNumber(bookCount)}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-primary-gray">
        <span className="rounded-lg bg-primary-black/35 px-2.5 py-1">
          {collection.list_type}
        </span>
        <span className="rounded-lg bg-primary-black/35 px-2.5 py-1">
          {isPrivate ? "Private" : "Public"}
        </span>
      </div>
    </article>
  );

  if (!canOpenCollections) return card;

  return (
    <Link
      to={routeBuilders.collection(collection.id)}
      className="block h-full rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      aria-label={`Open ${collection.name}`}
    >
      {card}
    </Link>
  );
}

function HeaderAction(): ReactElement {
  return (
    <Link
      to={routePaths.collections}
      className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[var(--surface-glass-border)] px-4 py-2 text-sm font-semibold text-primary-white hover:border-accent hover:text-accent"
    >
      Manage shelves
    </Link>
  );
}

export function CollectionsShelf({
  collections,
  canOpenCollections = false,
}: CollectionsShelfProps): ReactElement | null {
  if (!collections?.length) return null;

  return (
    <section className="flex flex-col gap-4" aria-labelledby="collections-shelf-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-accent">Library</p>
          <h2 id="collections-shelf-title" className="text-2xl font-bold text-primary-white">
            Collections shelf
          </h2>
        </div>
        {canOpenCollections ? <HeaderAction /> : null}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection) => (
          <CollectionCard
            key={collection.id}
            collection={collection}
            canOpenCollections={canOpenCollections}
          />
        ))}
      </div>
    </section>
  );
}
