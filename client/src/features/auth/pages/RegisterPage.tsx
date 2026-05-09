import { useState, type ReactElement } from "react";
import { useFormik } from "formik";
import { Link } from "react-router-dom";

import { FieldError } from "../../../components/ui";
import {
  AuthPasswordField,
  AuthSubmitButton,
  AuthTextField,
} from "../components/AuthFields";
import {
  getPasswordRequirements,
  PasswordQualityPanel,
  RegisterShelfPreview,
} from "../components/RegisterPageSections";
import { routePaths } from "../../../routes/paths";
import { useRegisterMutation } from "../hooks/useRegisterMutation";
import type { RegisterPayload } from "../types/auth";
import { registerSchema } from "./RegisterPage.schema";
import Logo from "/logo.svg";

const registerInitialValues: RegisterPayload = {
  name: "",
  handle: "",
  email: "",
  password1: "",
  password2: "",
};

const onboardingSteps = [
  { label: "Account", detail: "Email login" },
  { label: "Profile", detail: "Name and handle" },
  { label: "Shelf", detail: "Ready to build" },
] as const;

const Register = (): ReactElement => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const registerMutation = useRegisterMutation();

  const formik = useFormik<RegisterPayload>({
    initialValues: registerInitialValues,
    validationSchema: registerSchema,
    onSubmit: async (values, helpers) => {
      const normalizedValues: RegisterPayload = {
        name: values.name.trim(),
        handle: values.handle.trim(),
        email: values.email.trim().toLowerCase(),
        password1: values.password1,
        password2: values.password2,
      };

      try {
        await registerMutation.submitRegister(normalizedValues);
      } catch {
        // The mutation handles user-facing error copy.
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const isSubmitting = formik.isSubmitting || registerMutation.isPending;
  const passwordRequirements = getPasswordRequirements(
    formik.values.password1,
    formik.values.password2
  );

  return (
    <section className="relative left-1/2 min-h-[calc(100vh-10rem)] w-screen -translate-x-1/2 overflow-hidden bg-[linear-gradient(135deg,var(--color-primary-black),var(--color-secondary-black)_58%,var(--color-primary-black))] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-14rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(400px,520px)]">
        <RegisterShelfPreview />

        <article
          className="mx-auto w-full max-w-xl rounded-lg border border-[var(--surface-glass-border)] bg-[var(--surface-panel-strong)] p-5 shadow-lg backdrop-blur-xl sm:p-7 lg:mx-0"
          aria-labelledby="register-title"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              to={routePaths.root}
              className="inline-flex items-center gap-3 rounded-lg text-primary-white hover:text-accent lg:hidden"
              aria-label="BookNest home"
            >
              <img
                className="h-10 w-10"
                src={Logo}
                alt=""
                width="40"
                height="40"
              />
              <span className="font-bold">BookNest</span>
            </Link>
            <span className="rounded-full border border-success/25 bg-success/15 px-3 py-1 text-xs font-semibold text-success">
              Reader account
            </span>
          </div>

          <div className="mt-6">
            <p className="text-sm font-semibold text-accent">
              Create your account
            </p>
            <h1
              id="register-title"
              className="mt-2 text-3xl font-bold leading-tight text-primary-white sm:text-4xl text-balance"
            >
              Start your reading profile
            </h1>
            <p
              id="register-description"
              className="mt-3 text-sm leading-6 text-primary-gray"
            >
              Choose a secure login, name, and public handle so your reviews,
              collections, and recommendations have a home.
            </p>
          </div>

          <ol
            className="mt-5 grid grid-cols-3 gap-2"
            aria-label="Account setup steps"
          >
            {onboardingSteps.map((step, index) => (
              <li
                key={step.label}
                className="rounded-lg border border-secondary-gray/55 bg-primary-black/25 p-3"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-contrast">
                  {index + 1}
                </span>
                <p className="mt-3 text-sm font-semibold text-primary-white">
                  {step.label}
                </p>
                <p className="mt-1 text-xs leading-5 text-primary-gray">
                  {step.detail}
                </p>
              </li>
            ))}
          </ol>

          <form
            noValidate
            onSubmit={formik.handleSubmit}
            className="mt-6 grid gap-4"
            aria-describedby="register-description"
          >
            <AuthTextField
              id="name"
              name="name"
              label="Name"
              autoComplete="name"
              maxLength={150}
              placeholder="Mahmoud Ahmed"
              description="Shown on reviews, follows, notifications, and your public profile."
              value={formik.values.name}
              touched={formik.touched.name}
              error={formik.errors.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            <AuthTextField
              id="handle"
              name="handle"
              label="Handle"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={64}
              placeholder="reader-name"
              description="Shown on your public profile. Use 2-64 letters, numbers, underscores, or hyphens."
              value={formik.values.handle}
              touched={formik.touched.handle}
              error={formik.errors.handle}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            <AuthTextField
              id="email"
              name="email"
              type="email"
              label="Email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="you@example.com"
              value={formik.values.email}
              touched={formik.touched.email}
              error={formik.errors.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            <AuthPasswordField
              id="password1"
              name="password1"
              label="Password"
              autoComplete="new-password"
              maxLength={128}
              placeholder="Create a unique password"
              description="Use a password you do not reuse on other sites."
              value={formik.values.password1}
              touched={formik.touched.password1}
              error={formik.errors.password1}
              isVisible={showPassword}
              onToggleVisibility={() => setShowPassword((current) => !current)}
              toggleLabel={showPassword ? "Hide password" : "Show password"}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            <AuthPasswordField
              id="password2"
              name="password2"
              label="Confirm password"
              autoComplete="new-password"
              maxLength={128}
              placeholder="Repeat your password"
              value={formik.values.password2}
              touched={formik.touched.password2}
              error={formik.errors.password2}
              isVisible={showConfirmPassword}
              onToggleVisibility={() =>
                setShowConfirmPassword((current) => !current)
              }
              toggleLabel={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />

            <PasswordQualityPanel requirements={passwordRequirements} />

            {registerMutation.isError ? (
              <div className="rounded-lg border border-error-border bg-error-surface px-4 py-3">
                <FieldError
                  className="mt-0"
                  message={
                    registerMutation.errorMessage ??
                    "We couldn't create your account. Please try again."
                  }
                />
              </div>
            ) : null}

            <div className="grid gap-3 pt-1">
              <AuthSubmitButton
                isSubmitting={isSubmitting}
                idleLabel="Create account"
                submittingLabel="Creating account..."
              />
              <p className="text-center text-sm text-primary-gray">
                Already have an account?{" "}
                <Link
                  to={routePaths.login}
                  className="font-semibold text-accent hover:text-primary-white"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </article>
      </div>
    </section>
  );
};

export default Register;
