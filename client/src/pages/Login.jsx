import { useFormik } from "formik";
import * as Yup from "yup";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import Logo from "/logo.svg";

import { login } from "../services/authService";
import { useAuth } from "../context/AuthContext";

import { toast } from "react-hot-toast";

const Login = () => {
  const { userLogin } = useAuth();
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      console.log(data);

      if (data.access) {
        toast.success("Logged in successfully", {
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        });
        userLogin(null, data.access);
        navigate("/explore");
      } else {
        toast.error("Login failed", {
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        });
      }
    },
    onError: (error) => {
      toast.error(error);
      console.error(error);
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
    onSubmit: (values) => {
      mutation.mutate(values);
    },
  });

  return (
    <div className="flex flex-grow justify-center items-center">
      <div className="flex flex-col gap-md py-md flex-grow">
        <h2 className="text-2xl text-accent-v bg-clip-text text-transparent font-semibold text-center">
          Sign In
        </h2>
        <form onSubmit={formik.handleSubmit} className="flex flex-col gap-3 ">
          {/* Email */}
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

          {/* Password */}
          <div>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Password"
              className={`field w-full ${
                formik.touched.password && formik.errors.password
                  ? "border-red-500"
                  : ""
              }`}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.password}
            />
            {formik.touched.password && formik.errors.password && (
              <p className="mt-1 text-sm text-red-500">
                {formik.errors.password}
              </p>
            )}
          </div>

          {/* Button */}
          <div className="flex flex-col gap-3 mt-4">
            <button
              type="submit"
              className="btn btn-accent-v"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Signing in..." : "Sign In"}
            </button>
            <Link to="/register" className="btn btn-primary-v text-center">
              Create Account
            </Link>
          </div>

          {mutation.isError && (
            <p className="text-red-500 text-sm text-center mt-2">
              {mutation.error.response?.data?.message ||
                "Login failed. Try again."}
            </p>
          )}
        </form>
        {/* <div className="flex flex-col items-center gap-2">
        <p className="text-center">Forgot Password?</p>
        <Link to="/resetpassword" className="btn text-sm">
          Reset Password
        </Link>
      </div> */}
      </div>
    </div>
  );
};

export default Login;
