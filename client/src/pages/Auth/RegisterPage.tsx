import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import { register, createProfile } from "../../services/authService";
import { useAuth } from "../../store/AuthContext";
import FieldError from "../../components/FieldError";
import InlineSpinner from "../../components/InlineSpinner";

function PasswordToggleIcon() {
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

const Register = () => {
  const { userLogin } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const mutation = useMutation({
    mutationFn: register,
    onSuccess: async (data) => {
      if (data.access) {
        toast.success("Account created. Welcome to BookNest.");
        userLogin(null, data.access);
        await createProfile();
        navigate("/explore");
      } else {
        toast.error("Couldn't create your account. Try again.");
      }
    },
    onError: () => {
      toast.error("Couldn't create your account. Check your details.");
    },
  });

  const formik = useFormik({
    initialValues: {
      username: "",
      email: "",
      password1: "",
      password2: "",
    },
    validationSchema: Yup.object({
      username: Yup.string()
        .required("Username is required")
        .min(2, "Username must be at least 2 characters"),
      email: Yup.string()
        .email("Invalid email address")
        .required("Email is required"),
      password1: Yup.string()
        .min(8, "Password must be at least 8 characters")
        .required("Password is required"),
      password2: Yup.string()
        .oneOf([Yup.ref("password1")], "Passwords must match")
        .required("Confirm password is required"),
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
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-3xl text-accent-v bg-clip-text text-transparent font-semibold text-balance">
              Sign Up
            </h1>
            <p className="text-sm leading-relaxed text-primary-gray">
              Create your account and start building your shelf.
            </p>
          </div>

          <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="username" className="mb-2 block text-sm font-medium text-primary-white">
                Username <span aria-hidden="true" className="text-accent">*</span>
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                className={`field w-full text-primary-white focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-primary-black ${
                  formik.touched.username && formik.errors.username
                    ? "border-red-500"
                    : ""
                }`}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.username}
                aria-invalid={Boolean(formik.touched.username && formik.errors.username)}
                aria-describedby="username-error"
              />
              <div id="username-error">
                <FieldError
                  message={
                    formik.touched.username ? formik.errors.username : undefined
                  }
                />
              </div>
            </div>

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
              <label htmlFor="password1" className="mb-2 block text-sm font-medium text-primary-white">
                Password <span aria-hidden="true" className="text-accent">*</span>
              </label>
              <div className="relative">
                <input
                  id="password1"
                  name="password1"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className={`field w-full pr-12 text-primary-white focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-primary-black ${
                    formik.touched.password1 && formik.errors.password1
                      ? "border-red-500"
                      : ""
                  }`}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.password1}
                  aria-invalid={Boolean(
                    formik.touched.password1 && formik.errors.password1
                  )}
                  aria-describedby="password1-error"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-1 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-xl text-primary-gray hover:text-primary-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <PasswordToggleIcon />
                </button>
              </div>
              <div id="password1-error">
                <FieldError
                  message={
                    formik.touched.password1 ? formik.errors.password1 : undefined
                  }
                />
              </div>
            </div>

            <div>
              <label htmlFor="password2" className="mb-2 block text-sm font-medium text-primary-white">
                Confirm password <span aria-hidden="true" className="text-accent">*</span>
              </label>
              <div className="relative">
                <input
                  id="password2"
                  name="password2"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className={`field w-full pr-12 text-primary-white focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-primary-black ${
                    formik.touched.password2 && formik.errors.password2
                      ? "border-red-500"
                      : ""
                  }`}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.password2}
                  aria-invalid={Boolean(
                    formik.touched.password2 && formik.errors.password2
                  )}
                  aria-describedby="password2-error"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  className="absolute right-1 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-xl text-primary-gray hover:text-primary-white"
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  <PasswordToggleIcon />
                </button>
              </div>
              <div id="password2-error">
                <FieldError
                  message={
                    formik.touched.password2 ? formik.errors.password2 : undefined
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
                {isSubmitting ? "Creating account..." : "Sign Up"}
              </button>
              <Link
                to="/login"
                className="btn btn-primary-v inline-flex min-h-[44px] items-center justify-center text-center"
              >
                Sign In
              </Link>
            </div>

            {mutation.isError ? (
              <FieldError message="We couldn't create your account. Please try again." />
            ) : null}
          </form>
        </div>
      </div>
    </section>
  );
};

export default Register;
