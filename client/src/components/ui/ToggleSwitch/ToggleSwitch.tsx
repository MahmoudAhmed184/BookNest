import type { ReactElement } from "react";

export interface ToggleSwitchProps {
  checked: boolean;
  label: string;
  description?: string | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
  onChange: (checked: boolean) => void;
}

export function ToggleSwitch({
  checked,
  label,
  description,
  disabled = false,
  className = "",
  onChange,
}: ToggleSwitchProps): ReactElement {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={`flex min-h-[44px] w-full items-center justify-between gap-4 rounded-xl px-4 py-3 text-left transition-all duration-200 ease-out ${
        checked ? "bg-primary-black text-primary-white" : "bg-secondary-gray/70 text-primary-gray"
      } ${className}`}
      onClick={() => onChange(!checked)}
    >
      <span className="flex min-w-0 flex-col">
        <span className="text-sm font-semibold text-primary-white">{label}</span>
        {description ? (
          <span className="text-xs leading-relaxed text-primary-gray">
            {description}
          </span>
        ) : null}
      </span>
      <span
        className={`relative h-7 w-12 shrink-0 rounded-full border border-[var(--surface-glass-border)] transition-colors duration-200 ease-out ${
          checked ? "bg-accent" : "bg-primary-black"
        }`}
        aria-hidden="true"
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-primary-white shadow-md transition-transform duration-200 ease-out ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </span>
    </button>
  );
}

export default ToggleSwitch;
