import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import { login } from "../../services/authService";
import { useAuth } from "../../store/AuthContext";
import FieldError from "../../components/FieldError";
import InlineSpinner from "../../components/InlineSpinner";

const Login = () => {
  const { userLogin } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      if (data.access) {
        toast.success("Signed in. Welcome back.");
        userLogin(null, data.access);
        navigate("/explore");
      } else {
        toast.error("Couldn't sign in. Try again.");
      }
    },
    onError: () => {
      toast.error("Couldn't sign in. Check your details.");
    },
  });

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email("Invalid email address")
        .required("Email is required"),
      password: Yup.string()
        .min(8, "Password must be at least 8 characters")
        .required("Password is required"),
    }),
    onSubmit: async (values, helpers) => {
      try {
        await mutation.mutateAsync(values);
      } catch {
        // The mutation handles user-facing error copy.
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const isSubmitting = formik.isSubmitting || mutation.isPending;

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
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-primary-white">
                Email <span aria-hidden="true" className="text-accent">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className={`field w-full text-primary-white focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-primary-black ${
                  formik.touched.email && formik.errors.email
                    ? "border-red-500"
                    : ""
                }`}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.email}
                aria-invalid={Boolean(formik.touched.email && formik.errors.email)}
                aria-describedby="email-error"
              />
              <div id="email-error">
                <FieldError
                  message={
                    formik.touched.email ? formik.errors.email : undefined
                  }
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-primary-white">
                Password <span aria-hidden="true" className="text-accent">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className={`field w-full pr-12 text-primary-white focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-primary-black ${
                    formik.touched.password && formik.errors.password
                      ? "border-red-500"
                      : ""
                  }`}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.password}
                  aria-invalid={Boolean(
                    formik.touched.password && formik.errors.password
                  )}
                  aria-describedby="password-error"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-1 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-xl text-primary-gray hover:text-primary-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                </button>
              </div>
              <div id="password-error">
                <FieldError
                  message={
                    formik.touched.password ? formik.errors.password : undefined
                  }
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                type="submit"
                className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? <InlineSpinner /> : null}
                {isSubmitting ? "Signing in..." : "Sign In"}
              </button>
              <Link
                to="/register"
                className="btn btn-primary-v inline-flex min-h-[44px] items-center justify-center text-center"
              >
                Create Account
              </Link>
              <Link
                to="/resetpassword"
                className="min-h-[44px] rounded-xl px-4 py-3 text-center text-sm text-primary-gray hover:text-primary-white"
              >
                Forgot password?
              </Link>
            </div>

            {mutation.isError ? (
              <FieldError message="We couldn't sign you in. Please try again." />
            ) : null}
          </form>
        </div>
      </div>
    </section>
  );
};

export default Login;
