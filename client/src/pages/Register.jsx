import { useFormik } from "formik";
import * as Yup from "yup";
import { Link } from "react-router-dom";
import Logo from "/logo.svg"; // Adjust path as needed
import { useMutation } from "@tanstack/react-query";
import { register, createProfile } from "../services/authService";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";

const Register = () => {
  const { userLogin } = useAuth();
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: register,
    onSuccess: async (data) => {
      if (data.access) {
        console.log(data);
        toast.success("Account created successfully", {
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        });
        userLogin(null, data.access);
        await createProfile();
        navigate("/explore");
      } else {
        toast.error("Account creation failed", {
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        });
      }
    },
    onError: (error) => {
      console.log(error);
    },
  });
  // Formik setup with validation schema
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
        .oneOf([Yup.ref("password1"), null], "Passwords must match")
        .required("Confirm password is required"),
    }),
    onSubmit: (values) => {
      mutation.mutate(values);
    },
  });

  return (
    <div className="flex flex-grow justify-center items-center">
      <div className="flex flex-col gap-md py-md flex-grow">
        <h2 className="text-2xl text-accent-v bg-clip-text text-transparent font-semibold text-center">
          Sign Up
        </h2>

        {/* Form */}
        <form onSubmit={formik.handleSubmit} className="flex flex-col gap-3">
          {/* Name Fields */}
          <div>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="Username"
              className={`field w-full ${
                formik.touched.username && formik.errors.username
                  ? "border-red-500"
                  : ""
              }`}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.username}
            />
            {formik.touched.username && formik.errors.username && (
              <p className="mt-1 text-sm text-red-500">
                {formik.errors.username}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Email"
              className={`field w-full ${
                formik.touched.email && formik.errors.email
                  ? "border-red-500"
                  : ""
              }`}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.email}
            />
            {formik.touched.email && formik.errors.email && (
              <p className="mt-1 text-sm text-red-500">{formik.errors.email}</p>
            )}
          </div>

          {/* Password Fields */}
          <div>
            <input
              id="password1"
              name="password1"
              type="password"
              placeholder="Password"
              className={`field w-full ${
                formik.touched.password1 && formik.errors.password1
                  ? "border-red-500"
                  : ""
              }`}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.password1}
            />
            {formik.touched.password1 && formik.errors.password1 && (
              <p className="mt-1 text-sm text-red-500">
                {formik.errors.password1}
              </p>
            )}
          </div>
          <div>
            <input
              id="password2"
              name="password2"
              type="password"
              placeholder="Confirm Password"
              className={`field w-full ${
                formik.touched.password2 && formik.errors.password2
                  ? "border-red-500"
                  : ""
              }`}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.password2}
            />
            {formik.touched.password2 && formik.errors.password2 && (
              <p className="mt-1 text-sm text-red-500">
                {formik.errors.password2}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3 mt-4">
            <button type="submit" className="btn btn-accent-v">
              Sign Up
            </button>
            <Link to="/login" className="btn btn-primary-v text-center">
              Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
