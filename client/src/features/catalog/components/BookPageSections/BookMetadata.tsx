import type { ReactElement } from "react";

import type { Book } from "../../types/book";

export interface BookMetadataProps {
  book: Book;
}

export function BookMetadata({ book }: BookMetadataProps): ReactElement {
  const metadata = [
    { id: "release", label: "Release Date", value: book.publication_date || book.date || "Unknown" },
    { id: "pages", label: "Pages", value: book.number_of_pages || "Unknown" },
    { id: "language", label: "Language", value: book.language || "Unknown" },
    { id: "isbn", label: "ISBN", value: book.isbn13 },
  ];

  return (
    <dl className="grid gap-3 text-sm text-primary-gray sm:grid-cols-2">
      {metadata.map((item) => (
        <div key={item.id} className="glass-card p-4">
          <dt className="text-primary-white">{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
