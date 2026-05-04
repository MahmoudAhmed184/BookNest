import type { CSSProperties, ReactElement } from "react";

interface MoodDotStyle extends CSSProperties {
  "--mood-color": string;
}

export interface FilterOptionProps {
  id: string;
  label: string;
  checked: boolean;
  colorToken?: string | undefined;
  onToggle: () => void;
}

export function FilterOption({
  id,
  label,
  checked,
  colorToken,
  onToggle,
}: FilterOptionProps): ReactElement {
  const dotStyle: MoodDotStyle | undefined = colorToken
    ? { "--mood-color": colorToken }
    : undefined;

  return (
    <label
      htmlFor={id}
      className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-200 ease-out ${
        checked
          ? "bg-primary-black text-primary-white"
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
      {colorToken ? (
        <span
          className="mood-dot h-2.5 w-2.5 rounded-full"
          style={dotStyle}
          aria-hidden="true"
        />
      ) : null}
      <span>{label}</span>
    </label>
  );
}
