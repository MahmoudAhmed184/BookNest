export function getPasswordUpdateError(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): string {
  if (!currentPassword.trim()) return "Current password is required";
  if (newPassword.length < 8) return "Password must be at least 8 characters";
  if (newPassword !== confirmPassword) return "Passwords do not match";
  return "";
}
