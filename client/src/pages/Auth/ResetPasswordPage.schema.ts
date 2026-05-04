import * as Yup from "yup";
import type {
  EmailResetPayload,
  OtpResetPayload,
  PasswordResetPayload,
} from "../../types/auth";

export const emailResetSchema: Yup.ObjectSchema<EmailResetPayload> =
  Yup.object({
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
  });

export const otpResetSchema: Yup.ObjectSchema<OtpResetPayload> = Yup.object({
  otp: Yup.string()
    .matches(/^\d{6}$/, "OTP must be a 6-digit number")
    .required("OTP is required"),
});

export const passwordResetSchema: Yup.ObjectSchema<PasswordResetPayload> =
  Yup.object({
    password: Yup.string()
      .min(8, "Password must be at least 8 characters")
      .required("Password is required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password")], "Passwords must match")
      .required("Confirm password is required"),
  });
