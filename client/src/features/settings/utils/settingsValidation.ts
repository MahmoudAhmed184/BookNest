export function getPasswordUpdateError(
  newPassword: string,
  confirmPassword: string
): string {
  if (newPassword.length < 8) return "Password must be at least 8 characters";
  if (newPassword !== confirmPassword) return "Passwords do not match";
  return "";
}
