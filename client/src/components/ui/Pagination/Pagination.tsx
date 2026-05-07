import type { ReactElement } from "react";

type PageItem = number | "start-ellipsis" | "end-ellipsis";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onPageChange: (page: number) => void;
  isDisabled?: boolean;
  ariaLabel?: string;
}

function getPageItems(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "end-ellipsis", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "start-ellipsis",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "start-ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "end-ellipsis",
    totalPages,
  ];
}

export function Pagination({
  currentPage,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  onPageChange,
  isDisabled = false,
  ariaLabel = "Pagination",
}: PaginationProps): ReactElement | null {
  if (totalPages <= 1) return null;

  const previousPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);
  const isPreviousDisabled = isDisabled || !hasPreviousPage;
  const isNextDisabled = isDisabled || !hasNextPage;
  const pageItems = getPageItems(currentPage, totalPages);
  const navButtonClasses =
    "inline-flex min-h-[44px] items-center justify-center rounded-lg border border-secondary-gray bg-secondary-black px-3 py-2 text-sm font-semibold text-primary-white transition-colors hover:border-accent hover:bg-primary-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-secondary-gray disabled:hover:bg-secondary-black sm:px-4";
  const pageButtonBaseClasses =
    "inline-flex h-11 min-w-11 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-default";

  return (
    <nav
      className="rounded-lg border border-secondary-gray/60 bg-primary-black/40 p-3"
      aria-label={ariaLabel}
    >
      <div className="grid grid-cols-[minmax(4.75rem,1fr)_auto_minmax(4.75rem,1fr)] items-center gap-2 sm:flex sm:flex-wrap sm:justify-center">
        <button
          type="button"
          className={navButtonClasses}
          disabled={isPreviousDisabled}
          onClick={() => onPageChange(previousPage)}
          aria-label={`Go to previous page, page ${previousPage}`}
        >
          Previous
        </button>
        <p
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-secondary-black px-3 text-center text-sm font-semibold text-primary-white sm:hidden"
          aria-live="polite"
        >
          Page {currentPage} of {totalPages}
        </p>
        <ol
          className="hidden items-center justify-center gap-1 sm:flex"
          aria-label="Pages"
        >
          {pageItems.map((item) => {
            if (typeof item !== "number") {
              return (
                <li key={item} aria-hidden="true">
                  <span className="inline-flex h-11 min-w-11 items-center justify-center text-primary-gray">
                    ...
                  </span>
                </li>
              );
            }

            const isCurrent = item === currentPage;

            return (
              <li key={item}>
                <button
                  type="button"
                  className={`${pageButtonBaseClasses} ${
                    isCurrent
                      ? "border-accent bg-accent text-primary-black"
                      : "border-secondary-gray bg-secondary-black text-primary-white hover:border-accent hover:bg-primary-black"
                  }`}
                  disabled={isDisabled || isCurrent}
                  onClick={() => onPageChange(item)}
                  aria-label={
                    isCurrent ? `Current page, page ${item}` : `Go to page ${item}`
                  }
                  aria-current={isCurrent ? "page" : undefined}
                >
                  {item}
                </button>
              </li>
            );
          })}
        </ol>
        <button
          type="button"
          className={navButtonClasses}
          disabled={isNextDisabled}
          onClick={() => onPageChange(nextPage)}
          aria-label={`Go to next page, page ${nextPage}`}
        >
          Next
        </button>
      </div>
    </nav>
  );
}
