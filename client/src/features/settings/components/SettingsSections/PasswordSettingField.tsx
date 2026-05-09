import type { ReactElement } from "react";

import { FieldError } from "../../../../components/ui";
import { PasswordToggleIcon } from "../../../auth/components/AuthFields";

export interface PasswordSettingFieldProps {
  id: string;
  label: string;
  value: string;
  isVisible: boolean;
  toggleLabel: string;
  autoComplete?: string | undefined;
  disabled?: boolean | undefined;
  error?: string | undefined;
  onChange: (value: string) => void;
  onToggle: () => void;
}

export function PasswordSettingField({
  id,
  label,
  value,
  isVisible,
  toggleLabel,
  autoComplete = "new-password",
  disabled = false,
  error,
  onChange,
  onToggle,
}: PasswordSettingFieldProps): ReactElement {
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-primary-gray">
        {label} <span aria-hidden="true" className="text-accent">*</span>
      </label>
      <div className="relative">
        <input
          id={id}
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="field w-full pr-12 text-primary-white"
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-1 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-xl text-primary-gray hover:text-primary-white"
          aria-label={toggleLabel}
          disabled={disabled}
        >
          <PasswordToggleIcon isVisible={isVisible} />
        </button>
      </div>
      {error ? (
        <div id={errorId}>
          <FieldError message={error} />
        </div>
      ) : null}
    </div>
  );
}
