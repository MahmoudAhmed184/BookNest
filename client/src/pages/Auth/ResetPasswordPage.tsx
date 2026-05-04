import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Link } from "react-router-dom";
import Logo from "/logo.svg";

import FieldError from "../../components/FieldError";
import InlineSpinner from "../../components/InlineSpinner";

function PasswordIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

const ResetPassword = () => {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const emailFormik = useFormik({
    initialValues: {
      email: "",
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email("Invalid email address")
        .required("Email is required"),
    }),
    onSubmit: async (_values, helpers) => {
      await Promise.resolve();
      setStep(2);
      helpers.setSubmitting(false);
    },
  });

  const otpFormik = useFormik({
    initialValues: {
      otp: "",
    },
    validationSchema: Yup.object({
      otp: Yup.string()
        .matches(/^\d{6}$/, "OTP must be a 6-digit number")
        .required("OTP is required"),
    }),
    onSubmit: async (_values, helpers) => {
      await Promise.resolve();
      setStep(3);
      helpers.setSubmitting(false);
    },
  });

  const passwordFormik = useFormik({
    initialValues: {
      password: "",
      confirmPassword: "",
    },
    validationSchema: Yup.object({
      password: Yup.string()
        .min(8, "Password must be at least 8 characters")
        .required("Password is required"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("password")], "Passwords must match")
        .required("Confirm password is required"),
    }),
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

          {step === 1 ? (
            <form onSubmit={emailFormik.handleSubmit} className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-primary-white">
                Email verification
              </h2>
              <div>
                <label htmlFor="reset-email" className="mb-2 block text-sm font-medium text-primary-white">
                  Email <span aria-hidden="true" className="text-accent">*</span>
                </label>
                <input
                  id="reset-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className={`field w-full text-primary-white focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-primary-black ${
                    emailFormik.touched.email && emailFormik.errors.email
                      ? "border-red-500"
                      : ""
                  }`}
                  onChange={emailFormik.handleChange}
                  onBlur={emailFormik.handleBlur}
                  value={emailFormik.values.email}
                  aria-invalid={Boolean(
                    emailFormik.touched.email && emailFormik.errors.email
                  )}
                  aria-describedby="reset-email-error"
                />
                <div id="reset-email-error">
                  <FieldError
                    message={
                      emailFormik.touched.email
                        ? emailFormik.errors.email
                        : undefined
                    }
                  />
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center gap-2"
                disabled={emailFormik.isSubmitting}
              >
                {emailFormik.isSubmitting ? <InlineSpinner /> : null}
                Send OTP
              </button>
              <Link to="/login" className="btn btn-primary-v inline-flex min-h-[44px] items-center justify-center text-center">
                Back to Sign In
              </Link>
            </form>
          ) : null}

          {step === 2 ? (
            <form onSubmit={otpFormik.handleSubmit} className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-primary-white">
                Enter your code
              </h2>
              <div>
                <label htmlFor="otp" className="mb-2 block text-sm font-medium text-primary-white">
                  6-digit OTP <span aria-hidden="true" className="text-accent">*</span>
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className={`field w-full text-primary-white focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-primary-black ${
                    otpFormik.touched.otp && otpFormik.errors.otp
                      ? "border-red-500"
                      : ""
                  }`}
                  onChange={otpFormik.handleChange}
                  onBlur={otpFormik.handleBlur}
                  value={otpFormik.values.otp}
                  aria-invalid={Boolean(otpFormik.touched.otp && otpFormik.errors.otp)}
                  aria-describedby="otp-error"
                />
                <div id="otp-error">
                  <FieldError
                    message={otpFormik.touched.otp ? otpFormik.errors.otp : undefined}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center gap-2"
                disabled={otpFormik.isSubmitting}
              >
                {otpFormik.isSubmitting ? <InlineSpinner /> : null}
                Verify OTP
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn btn-primary-v min-h-[44px] text-center"
              >
                Back to Email
              </button>
            </form>
          ) : null}

          {step === 3 ? (
            <form onSubmit={passwordFormik.handleSubmit} className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-primary-white">
                Choose a new password
              </h2>
              <div>
                <label htmlFor="new-password" className="mb-2 block text-sm font-medium text-primary-white">
                  New password <span aria-hidden="true" className="text-accent">*</span>
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    className={`field w-full pr-12 text-primary-white focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-primary-black ${
                      passwordFormik.touched.password &&
                      passwordFormik.errors.password
                        ? "border-red-500"
                        : ""
                    }`}
                    onChange={passwordFormik.handleChange}
                    onBlur={passwordFormik.handleBlur}
                    value={passwordFormik.values.password}
                    aria-invalid={Boolean(
                      passwordFormik.touched.password &&
                        passwordFormik.errors.password
                    )}
                    aria-describedby="new-password-error"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-1 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-xl text-primary-gray hover:text-primary-white"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <PasswordIcon />
                  </button>
                </div>
                <div id="new-password-error">
                  <FieldError
                    message={
                      passwordFormik.touched.password
                        ? passwordFormik.errors.password
                        : undefined
                    }
                  />
                </div>
              </div>
              <div>
                <label htmlFor="confirm-new-password" className="mb-2 block text-sm font-medium text-primary-white">
                  Confirm new password <span aria-hidden="true" className="text-accent">*</span>
                </label>
                <div className="relative">
                  <input
                    id="confirm-new-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    className={`field w-full pr-12 text-primary-white focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-primary-black ${
                      passwordFormik.touched.confirmPassword &&
                      passwordFormik.errors.confirmPassword
                        ? "border-red-500"
                        : ""
                    }`}
                    onChange={passwordFormik.handleChange}
                    onBlur={passwordFormik.handleBlur}
                    value={passwordFormik.values.confirmPassword}
                    aria-invalid={Boolean(
                      passwordFormik.touched.confirmPassword &&
                        passwordFormik.errors.confirmPassword
                    )}
                    aria-describedby="confirm-new-password-error"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                    className="absolute right-1 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-xl text-primary-gray hover:text-primary-white"
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    <PasswordIcon />
                  </button>
                </div>
                <div id="confirm-new-password-error">
                  <FieldError
                    message={
                      passwordFormik.touched.confirmPassword
                        ? passwordFormik.errors.confirmPassword
                        : undefined
                    }
                  />
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center gap-2"
                disabled={passwordFormik.isSubmitting}
              >
                {passwordFormik.isSubmitting ? <InlineSpinner /> : null}
                Reset Password
              </button>
              <Link to="/login" className="btn btn-primary-v inline-flex min-h-[44px] items-center justify-center text-center">
                Back to Sign In
              </Link>
            </form>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default ResetPassword;
