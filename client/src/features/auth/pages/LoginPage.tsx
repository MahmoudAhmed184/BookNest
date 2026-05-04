import { useState, type ReactElement } from "react";
import { useFormik } from "formik";
import { Link } from "react-router-dom";

import { FieldError } from "../../../components/ui";
import {
  AuthNavLink,
  AuthPasswordField,
  AuthSubmitButton,
  AuthTextField,
} from "../components/AuthFields";
import { AuthShell } from "../components/AuthShell";
import { routePaths } from "../../../routes/paths";
import { useLoginMutation } from "../hooks/useLoginMutation";
import type { LoginPayload } from "../types/auth";
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
    <AuthShell title="Sign In" description="Welcome back to your reading shelf.">
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
    </AuthShell>
  );
};

export default Login;
