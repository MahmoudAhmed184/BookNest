import { useState, type ReactElement } from "react";
import { useFormik } from "formik";

import { AuthShell } from "../components/AuthShell";
import {
  EmailResetStep,
  OtpResetStep,
  PasswordResetStep,
} from "../components/ResetPasswordForms";
import type {
  EmailResetPayload,
  OtpResetPayload,
  PasswordResetPayload,
} from "../types/auth";
import {
  emailResetSchema,
  otpResetSchema,
  passwordResetSchema,
} from "./ResetPasswordPage.schema";

const emailResetInitialValues: EmailResetPayload = { email: "" };
const otpResetInitialValues: OtpResetPayload = { otp: "" };
const passwordResetInitialValues: PasswordResetPayload = {
  password: "",
  confirmPassword: "",
};

const ResetPassword = (): ReactElement => {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const emailFormik = useFormik<EmailResetPayload>({
    initialValues: emailResetInitialValues,
    validationSchema: emailResetSchema,
    onSubmit: async (_values, helpers) => {
      await Promise.resolve();
      setStep(2);
      helpers.setSubmitting(false);
    },
  });

  const otpFormik = useFormik<OtpResetPayload>({
    initialValues: otpResetInitialValues,
    validationSchema: otpResetSchema,
    onSubmit: async (_values, helpers) => {
      await Promise.resolve();
      setStep(3);
      helpers.setSubmitting(false);
    },
  });

  const passwordFormik = useFormik<PasswordResetPayload>({
    initialValues: passwordResetInitialValues,
    validationSchema: passwordResetSchema,
    onSubmit: async (_values, helpers) => {
      await Promise.resolve();
      helpers.setSubmitting(false);
    },
  });

  return (
    <AuthShell
      title="Reset Password"
      description="Follow the steps to regain access to your account."
    >
          <div className="flex justify-center gap-2" aria-label={`Step ${step} of 3`}>
            {[1, 2, 3].map((item) => (
              <span
                key={item}
                className={`h-2.5 w-8 rounded-full transition-all duration-200 ease-out ${
                  step >= item ? "bg-accent" : "bg-secondary-gray"
                }`}
              />
            ))}
          </div>

          {step === 1 ? <EmailResetStep formik={emailFormik} /> : null}
          {step === 2 ? (
            <OtpResetStep formik={otpFormik} onBack={() => setStep(1)} />
          ) : null}
          {step === 3 ? (
            <PasswordResetStep
              formik={passwordFormik}
              showPassword={showPassword}
              showConfirmPassword={showConfirmPassword}
              onTogglePassword={() => setShowPassword((current) => !current)}
              onToggleConfirmPassword={() =>
                setShowConfirmPassword((current) => !current)
              }
            />
          ) : null}
    </AuthShell>
  );
};

export default ResetPassword;
