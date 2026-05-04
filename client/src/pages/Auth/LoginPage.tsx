import { useState, type ReactElement } from "react";
import { useFormik } from "formik";
import { Link } from "react-router-dom";

import { FieldError } from "../../components/FieldError";
import {
  AuthNavLink,
  AuthPasswordField,
  AuthSubmitButton,
  AuthTextField,
} from "../../features/auth/components/AuthFields";
import { routePaths } from "../../routes";
import { useLoginMutation } from "../../features/auth/hooks/useLoginMutation";
import type { LoginPayload } from "../../types/auth";
import { loginSchema } from "./LoginPage.schema";

const loginInitialValues: LoginPayload = {
  email: "",
  password: "",
};

const Login = (): ReactElement => {
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLoginMutation();

  const formik = useFormik<LoginPayload>({
    initialValues: loginInitialValues,
    validationSchema: loginSchema,
    onSubmit: async (values, helpers) => {
      try {
        await loginMutation.submitLogin(values);
      } catch {
        // The mutation handles user-facing error copy.
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const isSubmitting = formik.isSubmitting || loginMutation.isPending;

  return (
    <section className="flex grow items-center justify-center py-12 animate-fade-up">
      <div className="w-full max-w-md rounded-xl bg-primary-black/60">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-3xl text-accent-v bg-clip-text text-transparent font-semibold text-balance">
              Sign In
            </h1>
            <p className="text-sm leading-relaxed text-primary-gray">
              Welcome back to your reading shelf.
            </p>
          </div>

          <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
            <AuthTextField
              id="email"
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
            <AuthPasswordField
              id="password"
              name="password"
              label="Password"
              autoComplete="current-password"
              value={formik.values.password}
              touched={formik.touched.password}
              error={formik.errors.password}
              isVisible={showPassword}
              onToggleVisibility={() => setShowPassword((current) => !current)}
              toggleLabel={showPassword ? "Hide password" : "Show password"}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            <div className="flex flex-col gap-3 pt-2">
              <AuthSubmitButton
                isSubmitting={isSubmitting}
                idleLabel="Sign In"
                submittingLabel="Signing in..."
              />
              <AuthNavLink to={routePaths.register}>Create Account</AuthNavLink>
              <Link
                to={routePaths.resetPassword}
                className="min-h-[44px] rounded-xl px-4 py-3 text-center text-sm text-primary-gray hover:text-primary-white"
              >
                Forgot password?
              </Link>
            </div>
            {loginMutation.isError ? (
              <FieldError message="We couldn't sign you in. Please try again." />
            ) : null}
          </form>
        </div>
      </div>
    </section>
  );
};

export default Login;
