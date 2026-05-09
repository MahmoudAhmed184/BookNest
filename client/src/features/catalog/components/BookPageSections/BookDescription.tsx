import type { ReactElement } from "react";

export interface BookDescriptionProps {
  description: string;
  isExpanded: boolean;
  shouldCollapse: boolean;
  onToggle: () => void;
}

export function BookDescription({
  description,
  isExpanded,
  shouldCollapse,
  onToggle,
}: BookDescriptionProps): ReactElement {
  return (
    <section className="flex flex-col gap-4" aria-labelledby="description-title">
      <h2 id="description-title" className="font-display text-3xl font-bold leading-tight text-primary-white sm:text-4xl">
        About this book
      </h2>
      <p className={`max-w-4xl whitespace-pre-line text-sm leading-7 text-primary-gray sm:text-base sm:leading-8 ${shouldCollapse && !isExpanded ? "line-clamp-5" : ""}`}>
        {description}
      </p>
      {shouldCollapse ? (
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex min-h-[44px] items-center gap-2 self-start rounded-full px-4 py-2 text-sm font-semibold text-primary-white hover:bg-primary-white/10"
          aria-expanded={isExpanded}
        >
          {isExpanded ? "Read less" : "Read more"}
          <span aria-hidden="true">{isExpanded ? "^" : "v"}</span>
        </button>
      ) : null}
    </section>
  );
}
