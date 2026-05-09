import type {
  ChangeEventHandler,
  ComponentProps,
  FocusEventHandler,
  ReactElement,
} from "react";

import { FieldError } from "../../../../components/ui";

export interface AuthTextFieldProps {
  id: string;
  name: string;
  label: string;
  value: string;
  type?: string | undefined;
  autoComplete?: string | undefined;
  description?: string | undefined;
  error?: string | undefined;
  touched?: boolean | undefined;
  inputMode?: ComponentProps<"input">["inputMode"] | undefined;
  maxLength?: number | undefined;
  placeholder?: string | undefined;
  className?: string | undefined;
  inputClassName?: string | undefined;
  labelClassName?: string | undefined;
  autoCapitalize?: ComponentProps<"input">["autoCapitalize"] | undefined;
  spellCheck?: ComponentProps<"input">["spellCheck"] | undefined;
  showRequiredIndicator?: boolean | undefined;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onBlur: FocusEventHandler<HTMLInputElement>;
}

export function AuthTextField({
  id,
  name,
  label,
  value,
  type = "text",
  autoComplete,
  description,
  error,
  touched = false,
  inputMode,
  maxLength,
  placeholder,
  className = "",
  inputClassName = "",
  labelClassName = "",
  autoCapitalize,
  spellCheck,
  showRequiredIndicator = true,
  onChange,
  onBlur,
}: AuthTextFieldProps): ReactElement {
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
      <input
        id={id}
        name={name}
        type={type}
        inputMode={inputMode}
        maxLength={maxLength}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoCapitalize={autoCapitalize}
        spellCheck={spellCheck}
        className={`field w-full text-primary-white focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-primary-black ${inputClassName} ${hasError ? "border-accent" : ""}`}
        onChange={onChange}
        onBlur={onBlur}
        value={value}
        aria-invalid={hasError}
        aria-describedby={describedBy || undefined}
      />
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
