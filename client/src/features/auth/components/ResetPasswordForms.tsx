import type { ReactElement } from "react";
import { Link } from "react-router-dom";
import type { FormikProps } from "formik";

import type {
  EmailResetPayload,
  OtpResetPayload,
  PasswordResetPayload,
} from "../../../types/auth";
import { routePaths } from "../../../routes";
import {
  AuthNavLink,
  AuthPasswordField,
  AuthSubmitButton,
  AuthTextField,
} from "./AuthFields";

interface EmailStepProps {
  formik: FormikProps<EmailResetPayload>;
}

export function EmailResetStep({ formik }: EmailStepProps): ReactElement {
  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-primary-white">
        Email verification
      </h2>
      <AuthTextField
        id="reset-email"
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        value={formik.values.email}
        touched={formik.touched.email}
        error={formik.errors.email}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
      />
      <AuthSubmitButton
        isSubmitting={formik.isSubmitting}
        idleLabel="Send OTP"
        submittingLabel="Sending..."
      />
      <AuthNavLink to={routePaths.login}>Back to Sign In</AuthNavLink>
    </form>
  );
}

interface OtpStepProps {
  formik: FormikProps<OtpResetPayload>;
  onBack: () => void;
}

export function OtpResetStep({ formik, onBack }: OtpStepProps): ReactElement {
  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-primary-white">
        Enter your code
      </h2>
      <AuthTextField
        id="otp"
        name="otp"
        type="text"
        inputMode="numeric"
        label="6-digit OTP"
        autoComplete="one-time-code"
        value={formik.values.otp}
        touched={formik.touched.otp}
        error={formik.errors.otp}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
      />
      <AuthSubmitButton
        isSubmitting={formik.isSubmitting}
        idleLabel="Verify OTP"
        submittingLabel="Verifying..."
      />
      <button
        type="button"
        onClick={onBack}
        className="btn btn-primary-v min-h-[44px] text-center"
      >
        Back to Email
      </button>
    </form>
  );
}

interface PasswordStepProps {
  formik: FormikProps<PasswordResetPayload>;
  showPassword: boolean;
  showConfirmPassword: boolean;
  onTogglePassword: () => void;
  onToggleConfirmPassword: () => void;
}

export function PasswordResetStep({
  formik,
  showPassword,
  showConfirmPassword,
  onTogglePassword,
  onToggleConfirmPassword,
}: PasswordStepProps): ReactElement {
  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-primary-white">
        Choose a new password
      </h2>
      <AuthPasswordField
        id="new-password"
        name="password"
        label="New password"
        autoComplete="new-password"
        value={formik.values.password}
        touched={formik.touched.password}
        error={formik.errors.password}
        isVisible={showPassword}
        onToggleVisibility={onTogglePassword}
        toggleLabel={showPassword ? "Hide password" : "Show password"}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
      />
      <AuthPasswordField
        id="confirm-new-password"
        name="confirmPassword"
        label="Confirm new password"
        autoComplete="new-password"
        value={formik.values.confirmPassword}
        touched={formik.touched.confirmPassword}
        error={formik.errors.confirmPassword}
        isVisible={showConfirmPassword}
        onToggleVisibility={onToggleConfirmPassword}
        toggleLabel={
          showConfirmPassword ? "Hide confirm password" : "Show confirm password"
        }
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
      />
      <AuthSubmitButton
        isSubmitting={formik.isSubmitting}
        idleLabel="Reset Password"
        submittingLabel="Resetting..."
      />
      <Link
        to={routePaths.login}
        className="btn btn-primary-v inline-flex min-h-[44px] items-center justify-center text-center"
      >
        Back to Sign In
      </Link>
    </form>
  );
}
