import type { ReactElement } from "react";
import { Link } from "react-router-dom";
import type { FormikProps } from "formik";

import { routePaths } from "../../../../routes/paths";
import type { PasswordResetPayload } from "../../types/auth";
import { AuthPasswordField, AuthSubmitButton } from "../AuthFields";

export interface PasswordResetStepProps {
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
}: PasswordResetStepProps): ReactElement {
  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-primary-white">Choose a new password</h2>
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
        toggleLabel={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
      />
      <AuthSubmitButton isSubmitting={formik.isSubmitting} idleLabel="Reset Password" submittingLabel="Resetting..." />
      <Link to={routePaths.login} className="btn btn-primary-v inline-flex min-h-[44px] items-center justify-center text-center">
        Back to Sign In
      </Link>
    </form>
  );
}
