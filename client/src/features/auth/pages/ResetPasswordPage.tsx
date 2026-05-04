import { useState, type ReactElement } from "react";
import { useFormik } from "formik";
import Logo from "/logo.svg";

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
    <section className="flex grow items-center justify-center py-12 animate-fade-up">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <img
              className="h-16 w-16 transition-transform duration-200 ease-out hover:scale-105"
              src={Logo}
              alt="BookNest logo"
              width="64"
              height="64"
            />
            <h1 className="text-3xl text-accent-v bg-clip-text text-transparent font-semibold text-balance">
              Reset Password
            </h1>
            <p className="text-sm leading-relaxed text-primary-gray">
              Follow the steps to regain access to your account.
            </p>
          </div>

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
        </div>
      </div>
    </section>
  );
};

export default ResetPassword;
