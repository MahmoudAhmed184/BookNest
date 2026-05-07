import type { ReactElement } from "react";

export interface FilterOptionProps {
  id: string;
  label: string;
  checked: boolean;
  count?: number | undefined;
  onToggle: () => void;
}

export function FilterOption({
  id,
  label,
  checked,
  count,
  onToggle,
}: FilterOptionProps): ReactElement {
  return (
    <label
      htmlFor={id}
      className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 ease-out ${
        checked
          ? "bg-primary-black text-primary-white ring-1 ring-accent/70"
          : "text-primary-gray hover:bg-primary-black/70 hover:text-primary-white"
      }`}
    >
      <input
        id={id}
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={onToggle}
      />
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-md border ${
          checked ? "border-accent bg-accent text-primary-black" : "border-secondary-gray"
        }`}
        aria-hidden="true"
      >
        {checked ? "✓" : null}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {typeof count === "number" ? (
        <span className="min-w-8 rounded-full bg-secondary-black px-2 py-0.5 text-center text-xs font-semibold text-primary-gray">
          {count}
        </span>
      ) : null}
    </label>
  );
}
