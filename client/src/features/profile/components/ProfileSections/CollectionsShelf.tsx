import type { ReactElement } from "react";

import type { ReadingList } from "../../../collections/types/collection";

export interface CollectionsShelfProps {
  collections?: ReadingList[] | undefined;
}

export function CollectionsShelf({ collections }: CollectionsShelfProps): ReactElement | null {
  if (!collections?.length) return null;

  return (
    <section className="flex flex-col gap-4" aria-labelledby="collections-shelf-title">
      <h2 id="collections-shelf-title" className="text-xl font-bold text-primary-white">
        Collections Shelf
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection) => (
          <article
            key={collection.list_id}
            className="glass-card card-lift min-w-0 p-4"
          >
            <div className="mb-4 flex h-28 items-end gap-1 overflow-hidden rounded-xl bg-primary-black p-3">
              {(collection.books ?? []).slice(0, 3).map((book) => (
                <div key={book.isbn13} className="h-24 w-14 overflow-hidden rounded-md bg-secondary-gray shadow-md">
                  {book.cover_img ? (
                    <img src={book.cover_img} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                  ) : null}
                </div>
              ))}
            </div>
            <h3 className="line-clamp-1 font-bold text-primary-white">{collection.name}</h3>
            <p className="text-sm text-primary-gray">{collection.book_count ?? collection.books?.length ?? 0} books</p>
          </article>
        ))}
      </div>
    </section>
  );
}
