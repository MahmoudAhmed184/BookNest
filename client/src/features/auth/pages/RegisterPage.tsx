import { useState, type ReactElement } from "react";
import { useFormik } from "formik";

import { FieldError } from "../../../components/ui";
import {
  AuthNavLink,
  AuthPasswordField,
  AuthSubmitButton,
  AuthTextField,
} from "../components/AuthFields";
import { AuthShell } from "../components/AuthShell";
import { routePaths } from "../../../routes/paths";
import { useRegisterMutation } from "../hooks/useRegisterMutation";
import type { RegisterPayload } from "../types/auth";
import { registerSchema } from "./RegisterPage.schema";

const registerInitialValues: RegisterPayload = {
  username: "",
  email: "",
  password1: "",
  password2: "",
};

const Register = (): ReactElement => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const registerMutation = useRegisterMutation();

  const formik = useFormik<RegisterPayload>({
    initialValues: registerInitialValues,
    validationSchema: registerSchema,
    onSubmit: async (values, helpers) => {
      try {
        await registerMutation.submitRegister(values);
      } catch {
        // The mutation handles user-facing error copy.
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const isSubmitting = formik.isSubmitting || registerMutation.isPending;

  return (
    <AuthShell title="Sign Up" description="Create your account and start building your shelf.">
      <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
            <AuthTextField
              id="username"
              name="username"
              label="Username"
              autoComplete="username"
              value={formik.values.username}
              touched={formik.touched.username}
              error={formik.errors.username}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
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
              id="password1"
              name="password1"
              label="Password"
              autoComplete="new-password"
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
              value={formik.values.password2}
              touched={formik.touched.password2}
              error={formik.errors.password2}
              isVisible={showConfirmPassword}
              onToggleVisibility={() => setShowConfirmPassword((current) => !current)}
              toggleLabel={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            <div className="flex flex-col gap-3 pt-2">
              <AuthSubmitButton
                isSubmitting={isSubmitting}
                idleLabel="Sign Up"
                submittingLabel="Creating account..."
              />
              <AuthNavLink to={routePaths.login}>Sign In</AuthNavLink>
            </div>
            {registerMutation.isError ? (
              <FieldError message="We couldn't create your account. Please try again." />
            ) : null}
      </form>
    </AuthShell>
  );
};

export default Register;
