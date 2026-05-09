import type { ReactElement } from "react";

import type { Book } from "../../types/book";

export interface BookMetadataProps {
  book: Book;
}

function formatPublication(book: Book): string {
  if (book.publication_date) {
    const date = new Date(book.publication_date);
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);
    }

    return book.publication_date;
  }

  return book.publication_year ? String(book.publication_year) : "Unknown";
}

function formatLanguage(language: string | undefined): string {
  if (!language) return "Unknown";
  return language.length <= 3 ? language.toUpperCase() : language;
}

export function BookMetadata({ book }: BookMetadataProps): ReactElement {
  const metadata = [
    { id: "published", label: "Published", value: formatPublication(book) },
    { id: "pages", label: "Pages", value: book.page_count ?? "Unknown" },
    { id: "language", label: "Language", value: formatLanguage(book.language) },
    { id: "isbn", label: "ISBN", value: book.isbn_13 || book.isbn_10 || "Unknown" },
  ];

  return (
    <dl className="grid gap-x-12 gap-y-5 text-sm sm:grid-cols-2">
      {metadata.map((item) => (
        <div key={item.id}>
          <dt className="mb-1 text-primary-gray">{item.label}</dt>
          <dd className={item.id === "isbn" ? "font-mono text-xs font-semibold text-primary-white" : "font-semibold text-primary-white"}>
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
