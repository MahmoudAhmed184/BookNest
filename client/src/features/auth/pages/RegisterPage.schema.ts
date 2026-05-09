import * as Yup from "yup";
import type { RegisterPayload } from "../types/auth";

export const registerSchema: Yup.ObjectSchema<RegisterPayload> = Yup.object({
  name: Yup.string()
    .trim()
    .required("Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(150, "Name must be 150 characters or fewer"),
  handle: Yup.string()
    .trim()
    .required("Handle is required")
    .min(2, "Handle must be at least 2 characters")
    .max(64, "Handle must be 64 characters or fewer")
    .matches(/^[a-zA-Z0-9_-]+$/, "Use letters, numbers, underscores, or hyphens"),
  email: Yup.string()
    .trim()
    .lowercase()
    .email("Invalid email address")
    .required("Email is required"),
  password1: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be 128 characters or fewer")
    .required("Password is required"),
  password2: Yup.string()
    .oneOf([Yup.ref("password1")], "Passwords must match")
    .required("Confirm password is required"),
});
