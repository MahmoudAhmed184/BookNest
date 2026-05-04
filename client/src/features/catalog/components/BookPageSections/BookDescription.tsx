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
    <section className="flex max-w-3xl flex-col gap-3" aria-labelledby="description-title">
      <h2 id="description-title" className="text-xl font-bold text-primary-white">
        Description
      </h2>
      <p className={`text-base leading-relaxed text-primary-white ${shouldCollapse && !isExpanded ? "line-clamp-4" : ""}`}>
        {description}
      </p>
      {shouldCollapse ? (
        <button
          type="button"
          onClick={onToggle}
          className="min-h-[44px] self-start rounded-full px-3 py-2 text-sm font-medium text-accent hover:bg-secondary-black"
          aria-expanded={isExpanded}
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </section>
  );
}
