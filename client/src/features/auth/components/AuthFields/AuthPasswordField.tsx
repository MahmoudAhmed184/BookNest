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
  description,
  error,
  touched = false,
  maxLength,
  placeholder,
  className = "",
  inputClassName = "",
  labelClassName = "",
  autoCapitalize,
  spellCheck,
  showRequiredIndicator = true,
  isVisible,
  onToggleVisibility,
  toggleLabel,
  onChange,
  onBlur,
}: AuthPasswordFieldProps): ReactElement {
  const errorId = `${id}-error`;
  const descriptionId = description ? `${id}-description` : undefined;
  const hasError = Boolean(touched && error);
  const describedBy = [descriptionId, hasError ? errorId : undefined]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={`mb-2 block text-sm font-medium text-primary-white ${labelClassName}`}
      >
        {label}{" "}
        {showRequiredIndicator ? (
          <span aria-hidden="true" className="ml-0.5 text-accent">
            *
          </span>
        ) : null}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={isVisible ? "text" : "password"}
          autoComplete={autoComplete}
          autoCapitalize={autoCapitalize}
          spellCheck={spellCheck}
          maxLength={maxLength}
          placeholder={placeholder}
          className={`field w-full pr-12 text-primary-white focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-primary-black ${inputClassName} ${hasError ? "border-accent" : ""}`}
          onChange={onChange}
          onBlur={onBlur}
          value={value}
          aria-invalid={hasError}
          aria-describedby={describedBy || undefined}
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
      {description ? (
        <p id={descriptionId} className="mt-2 text-xs leading-relaxed text-primary-gray">
          {description}
        </p>
      ) : null}
      <div id={errorId}>
        <FieldError message={touched ? error : undefined} />
      </div>
    </div>
  );
}
