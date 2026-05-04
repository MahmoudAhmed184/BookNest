import * as Yup from "yup";
import type { LoginPayload } from "../../types/auth";

export const loginSchema: Yup.ObjectSchema<LoginPayload> = Yup.object({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
});
