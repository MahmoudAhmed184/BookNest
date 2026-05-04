import type { ChangeEventHandler, FocusEventHandler, ReactElement } from "react";

import { FieldError } from "../../../../components/ui";

export interface AuthTextFieldProps {
  id: string;
  name: string;
  label: string;
  value: string;
  type?: string | undefined;
  autoComplete?: string | undefined;
  error?: string | undefined;
  touched?: boolean | undefined;
  inputMode?: "numeric" | undefined;
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
  error,
  touched = false,
  inputMode,
  onChange,
  onBlur,
}: AuthTextFieldProps): ReactElement {
  const errorId = `${id}-error`;
  const hasError = Boolean(touched && error);

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-primary-white">
        {label} <span aria-hidden="true" className="text-accent">*</span>
      </label>
      <input
        id={id}
        name={name}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        className={`field w-full text-primary-white focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-primary-black ${hasError ? "border-accent" : ""}`}
        onChange={onChange}
        onBlur={onBlur}
        value={value}
        aria-invalid={hasError}
        aria-describedby={errorId}
      />
      <div id={errorId}>
        <FieldError message={touched ? error : undefined} />
      </div>
    </div>
  );
}
