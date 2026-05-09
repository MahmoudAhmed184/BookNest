import { useState, type ReactElement } from "react";
import { useFormik } from "formik";
import { Link } from "react-router-dom";

import HighlightedQuote from "/highlighted-quote.jpg";

import { FieldError, InlineSpinner } from "../../../components/ui";
import {
  AuthPasswordField,
  AuthTextField,
} from "../components/AuthFields";
import { routePaths } from "../../../routes/paths";
import { useLoginMutation } from "../hooks/useLoginMutation";
import type { LoginPayload } from "../types/auth";
import { loginSchema } from "./LoginPage.schema";

const loginInitialValues: LoginPayload = {
  email: "",
  password: "",
};

function ArrowRightIcon(): ReactElement {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M4 10h12m0 0-4.5-4.5M16 10l-4.5 4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const Login = (): ReactElement => {
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLoginMutation();

  const formik = useFormik<LoginPayload>({
    initialValues: loginInitialValues,
    validationSchema: loginSchema,
    onSubmit: async (values, helpers) => {
      try {
        await loginMutation.submitLogin({
          ...values,
          email: values.email.trim(),
        });
      } catch {
        // The mutation handles user-facing error copy.
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const isSubmitting = formik.isSubmitting || loginMutation.isPending;

  return (
    <section className="login-page-surface relative left-1/2 min-h-[calc(100vh-10rem)] w-screen -translate-x-1/2 overflow-hidden animate-fade-up">
      <img
        src={HighlightedQuote}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-20 lg:hidden"
        aria-hidden="true"
      />
      <div className="login-mobile-shade absolute inset-0 lg:hidden" />

      <div className="container relative grid min-h-[calc(100vh-10rem)] items-center gap-8 py-8 sm:py-10 lg:grid-cols-[minmax(0,0.86fr)_minmax(28rem,0.68fr)] lg:py-12 xl:gap-12">
        <aside className="hidden lg:block" aria-label="BookNest reading space">
          <div className="relative min-h-[38rem] overflow-hidden rounded-lg border border-primary-white/10 bg-secondary-black shadow-lg">
            <img
              src={HighlightedQuote}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              aria-hidden="true"
            />
            <div className="login-artwork-shade absolute inset-0" />
            <div className="relative flex min-h-[38rem] flex-col justify-end p-8">
              <div className="max-w-md">
                <p className="font-display text-4xl font-bold leading-tight text-brand-white [text-wrap:balance]">
                  Pick up where the shelf remembers.
                </p>
                <p className="mt-4 max-w-sm text-sm leading-6 text-brand-gray">
                  The next quiet session starts here.
                </p>
              </div>
            </div>
          </div>
        </aside>

        <div className="mx-auto w-full max-w-[31rem] lg:mx-0 lg:justify-self-end">
          <div className="login-card p-5 sm:p-7">
            <div className="mb-7">
              <p className="mb-3 text-sm font-semibold text-accent">
                Welcome back
              </p>
              <h1 className="font-display text-3xl font-bold leading-tight text-primary-white sm:text-4xl">
                Sign in to BookNest
              </h1>
              <p className="mt-3 text-sm leading-6 text-primary-gray">
                Your shelves are ready when you are.
              </p>
            </div>

            <form
              noValidate
              onSubmit={formik.handleSubmit}
              className="flex flex-col gap-4"
            >
              <AuthTextField
                id="email"
                name="email"
                type="email"
                label="Email"
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="reader@booknest.dev"
                showRequiredIndicator={false}
                inputClassName="min-h-12 rounded-lg border-primary-white/10 bg-primary-black/45 text-base shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-primary-white)_8%,transparent)] placeholder:text-primary-gray/70 focus:border-accent"
                value={formik.values.email}
                touched={formik.touched.email}
                error={formik.errors.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              <AuthPasswordField
                id="password"
                name="password"
                label="Password"
                autoComplete="current-password"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="Enter your password"
                showRequiredIndicator={false}
                inputClassName="min-h-12 rounded-lg border-primary-white/10 bg-primary-black/45 text-base shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-primary-white)_8%,transparent)] placeholder:text-primary-gray/70 focus:border-accent"
                value={formik.values.password}
                touched={formik.touched.password}
                error={formik.errors.password}
                isVisible={showPassword}
                onToggleVisibility={() => setShowPassword((current) => !current)}
                toggleLabel={showPassword ? "Hide password" : "Show password"}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />

              <Link
                to={routePaths.resetPassword}
                className="w-fit self-end rounded-lg px-1 py-1 text-sm font-semibold text-primary-gray hover:text-accent"
              >
                Forgot password?
              </Link>

              {loginMutation.isError ? (
                <div className="rounded-lg border border-error-border bg-error-surface px-4 py-3">
                  <FieldError
                    className="mt-0 text-primary-white"
                    message="We couldn't sign you in. Please check your details and try again."
                  />
                </div>
              ) : null}

              <button
                type="submit"
                className="mt-1 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-bold text-accent-contrast shadow-glow hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:brightness-100"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? <InlineSpinner /> : <ArrowRightIcon />}
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-primary-gray">
              New to BookNest?{" "}
              <Link
                to={routePaths.register}
                className="font-semibold text-primary-white underline decoration-primary-white/30 underline-offset-4 hover:text-accent hover:decoration-accent"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Login;
