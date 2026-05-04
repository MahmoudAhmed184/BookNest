import type { ChangeEventHandler, FocusEventHandler, ReactElement } from "react";
import { Link } from "react-router-dom";

import { FieldError, InlineSpinner } from "../../../components/ui";

interface PasswordToggleIconProps {
  className?: string | undefined;
}

export function PasswordToggleIcon({
  className = "h-5 w-5",
}: PasswordToggleIconProps): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

interface AuthTextFieldProps {
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
        className={`field w-full text-primary-white focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-primary-black ${
          hasError ? "border-accent" : ""
        }`}
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

interface AuthPasswordFieldProps extends Omit<AuthTextFieldProps, "type"> {
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
          className={`field w-full pr-12 text-primary-white focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-primary-black ${
            hasError ? "border-accent" : ""
          }`}
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
          <PasswordToggleIcon />
        </button>
      </div>
      <div id={errorId}>
        <FieldError message={touched ? error : undefined} />
      </div>
    </div>
  );
}

interface AuthSubmitButtonProps {
  isSubmitting: boolean;
  idleLabel: string;
  submittingLabel: string;
}

export function AuthSubmitButton({
  isSubmitting,
  idleLabel,
  submittingLabel,
}: AuthSubmitButtonProps): ReactElement {
  return (
    <button
      type="submit"
      className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center gap-2"
      disabled={isSubmitting}
    >
      {isSubmitting ? <InlineSpinner /> : null}
      {isSubmitting ? submittingLabel : idleLabel}
    </button>
  );
}

interface AuthNavLinkProps {
  to: string;
  children: string;
}

export function AuthNavLink({ to, children }: AuthNavLinkProps): ReactElement {
  return (
    <Link
      to={to}
      className="btn btn-primary-v inline-flex min-h-[44px] items-center justify-center text-center"
    >
      {children}
    </Link>
  );
}
