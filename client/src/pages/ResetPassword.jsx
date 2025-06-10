import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Link } from "react-router-dom";
import Logo from "/logo.svg"; // Adjust path as needed

const ResetPassword = () => {
  // State to manage the current step (1: Email, 2: OTP, 3: New Password)
  const [step, setStep] = useState(1);

  // Formik setup for Step 1: Email
  const emailFormik = useFormik({
    initialValues: {
      email: "",
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email("Invalid email address")
        .required("Email is required"),
    }),
    onSubmit: (values) => {
      console.log("Email submitted:", values);
      setStep(2); // Move to OTP step
    },
  });

  // Formik setup for Step 2: OTP
  const otpFormik = useFormik({
    initialValues: {
      otp: "",
    },
    validationSchema: Yup.object({
      otp: Yup.string()
        .matches(/^\d{6}$/, "OTP must be a 6-digit number")
        .required("OTP is required"),
    }),
    onSubmit: (values) => {
      console.log("OTP submitted:", values);
      setStep(3); // Move to Password step
    },
  });

  // Formik setup for Step 3: New Password
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
        .oneOf([Yup.ref("password"), null], "Passwords must match")
        .required("Confirm password is required"),
    }),
    onSubmit: (values) => {
      console.log("New password submitted:", values);
      // Handle password reset completion (e.g., API call)
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo and Title */}
        <div className="flex justify-center items-center gap-sm">
          <img
            className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]"
            src={Logo}
            alt="BookNest Logo"
          />
          <h1 className="text-2xl text-accent-v bg-clip-text text-transparent font-semibold">
            BookNest
          </h1>
        </div>
        <h2 className="text-lg text-accent-v bg-clip-text text-transparent font-semibold text-center">
          Reset Password
        </h2>

        {/* Step Indicator */}
        <div className="flex justify-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              step >= 1 ? "bg-accent-v" : "bg-gray-300"
            }`}
          ></span>
          <span
            className={`h-2 w-2 rounded-full ${
              step >= 2 ? "bg-accent-v" : "bg-gray-300"
            }`}
          ></span>
          <span
            className={`h-2 w-2 rounded-full ${
              step >= 3 ? "bg-accent-v" : "bg-gray-300"
            }`}
          ></span>
        </div>

        {/* Step 1: Email Form */}
        {step === 1 && (
          <form
            onSubmit={emailFormik.handleSubmit}
            className="flex flex-col gap-3"
          >
            <div>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Email"
                className={`field w-full ${
                  emailFormik.touched.email && emailFormik.errors.email
                    ? "border-red-500"
                    : ""
                }`}
                onChange={emailFormik.handleChange}
                onBlur={emailFormik.handleBlur}
                value={emailFormik.values.email}
              />
              {emailFormik.touched.email && emailFormik.errors.email && (
                <p className="mt-1 text-sm text-red-500">
                  {emailFormik.errors.email}
                </p>
              )}
            </div>
            <button type="submit" className="btn btn-accent-v mt-4">
              Send OTP
            </button>
            <Link to="/login" className="btn btn-primary-v text-center">
              Back to Sign In
            </Link>
          </form>
        )}

        {/* Step 2: OTP Form */}
        {step === 2 && (
          <form
            onSubmit={otpFormik.handleSubmit}
            className="flex flex-col gap-3"
          >
            <div>
              <input
                id="otp"
                name="otp"
                type="text"
                placeholder="Enter 6-digit OTP"
                className={`field w-full ${
                  otpFormik.touched.otp && otpFormik.errors.otp
                    ? "border-red-500"
                    : ""
                }`}
                onChange={otpFormik.handleChange}
                onBlur={otpFormik.handleBlur}
                value={otpFormik.values.otp}
              />
              {otpFormik.touched.otp && otpFormik.errors.otp && (
                <p className="mt-1 text-sm text-red-500">
                  {otpFormik.errors.otp}
                </p>
              )}
            </div>
            <button type="submit" className="btn btn-accent-v mt-4">
              Verify OTP
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn btn-primary-v text-center"
            >
              Back to Email
            </button>
          </form>
        )}

        {/* Step 3: New Password Form */}
        {step === 3 && (
          <form
            onSubmit={passwordFormik.handleSubmit}
            className="flex flex-col gap-3"
          >
            <div>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="New Password"
                className={`field w-full ${
                  passwordFormik.touched.password &&
                  passwordFormik.errors.password
                    ? "border-red-500"
                    : ""
                }`}
                onChange={passwordFormik.handleChange}
                onBlur={passwordFormik.handleBlur}
                value={passwordFormik.values.password}
              />
              {passwordFormik.touched.password &&
                passwordFormik.errors.password && (
                  <p className="mt-1 text-sm text-red-500">
                    {passwordFormik.errors.password}
                  </p>
                )}
            </div>
            <div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm New Password"
                className={`field w-full ${
                  passwordFormik.touched.confirmPassword &&
                  passwordFormik.errors.confirmPassword
                    ? "border-red-500"
                    : ""
                }`}
                onChange={passwordFormik.handleChange}
                onBlur={passwordFormik.handleBlur}
                value={passwordFormik.values.confirmPassword}
              />
              {passwordFormik.touched.confirmPassword &&
                passwordFormik.errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500">
                    {passwordFormik.errors.confirmPassword}
                  </p>
                )}
            </div>
            <button type="submit" className="btn btn-accent-v mt-4">
              Reset Password
            </button>
            <Link to="/login" className="btn btn-primary-v text-center">
              Back to Sign In
            </Link>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
