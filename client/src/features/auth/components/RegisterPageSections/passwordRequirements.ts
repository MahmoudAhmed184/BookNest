export interface PasswordRequirement {
  id: string;
  label: string;
  isMet: boolean;
}

export function getPasswordRequirements(
  password: string,
  confirmation: string
): PasswordRequirement[] {
  return [
    {
      id: "length",
      label: "At least 8 characters",
      isMet: password.length >= 8,
    },
    {
      id: "case",
      label: "Upper and lower case letters",
      isMet: /[a-z]/.test(password) && /[A-Z]/.test(password),
    },
    {
      id: "variety",
      label: "Number or symbol",
      isMet: /[\d\W_]/.test(password),
    },
    {
      id: "match",
      label: "Passwords match",
      isMet: password.length > 0 && password === confirmation,
    },
  ];
}
