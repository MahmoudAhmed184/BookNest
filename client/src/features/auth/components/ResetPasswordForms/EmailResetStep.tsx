import type { ReactElement } from "react";
import type { FormikProps } from "formik";

import { routePaths } from "../../../../routes/paths";
import type { EmailResetPayload } from "../../types/auth";
import { AuthNavLink, AuthSubmitButton, AuthTextField } from "../AuthFields";

export interface EmailResetStepProps {
  formik: FormikProps<EmailResetPayload>;
}

export function EmailResetStep({ formik }: EmailResetStepProps): ReactElement {
  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-primary-white">Email verification</h2>
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
      <AuthSubmitButton isSubmitting={formik.isSubmitting} idleLabel="Send OTP" submittingLabel="Sending..." />
      <AuthNavLink to={routePaths.login}>Back to Sign In</AuthNavLink>
    </form>
  );
}
