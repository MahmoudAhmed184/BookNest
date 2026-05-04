import * as Yup from "yup";
import type { RegisterPayload } from "../types/auth";

export const registerSchema: Yup.ObjectSchema<RegisterPayload> = Yup.object({
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
});
