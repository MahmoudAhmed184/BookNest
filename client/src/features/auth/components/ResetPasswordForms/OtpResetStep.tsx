import type { ReactElement } from "react";
import type { FormikProps } from "formik";

import type { OtpResetPayload } from "../../types/auth";
import { AuthSubmitButton, AuthTextField } from "../AuthFields";

export interface OtpResetStepProps {
  formik: FormikProps<OtpResetPayload>;
  onBack: () => void;
}

export function OtpResetStep({ formik, onBack }: OtpResetStepProps): ReactElement {
  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-primary-white">Enter your code</h2>
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
      <AuthSubmitButton isSubmitting={formik.isSubmitting} idleLabel="Verify OTP" submittingLabel="Verifying..." />
      <button type="button" onClick={onBack} className="btn btn-primary-v min-h-[44px] text-center">
        Back to Email
      </button>
    </form>
  );
}
