import type { ReactElement } from "react";

import { FieldError } from "../../../../components/ui";
import type { AuthTextFieldProps } from "./AuthTextField";
import { PasswordToggleIcon } from "./PasswordToggleIcon";

export interface AuthPasswordFieldProps extends Omit<AuthTextFieldProps, "type"> {
  isVisible: boolean;
  onToggleVisibility: () => void;
  toggleLabel: string;
}

export function AuthPasswordField({
  id,
  name,
  label,
  value,
  autoComplete,
  error,
  touched = false,
  isVisible,
  onToggleVisibility,
  toggleLabel,
  onChange,
  onBlur,
}: AuthPasswordFieldProps): ReactElement {
  const errorId = `${id}-error`;
  const hasError = Boolean(touched && error);

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-primary-white">
        {label} <span aria-hidden="true" className="text-accent">*</span>
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={isVisible ? "text" : "password"}
          autoComplete={autoComplete}
          className={`field w-full pr-12 text-primary-white focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-primary-black ${hasError ? "border-accent" : ""}`}
          onChange={onChange}
          onBlur={onBlur}
          value={value}
          aria-invalid={hasError}
          aria-describedby={errorId}
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          className="absolute right-1 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-xl text-primary-gray hover:text-primary-white"
          aria-label={toggleLabel}
        >
          <PasswordToggleIcon isVisible={isVisible} />
        </button>
      </div>
      <div id={errorId}>
        <FieldError message={touched ? error : undefined} />
      </div>
    </div>
  );
}
