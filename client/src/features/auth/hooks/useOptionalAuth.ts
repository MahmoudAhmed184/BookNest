import { useContext } from "react";

import { AuthContext, type AuthContextValue } from "../store/AuthContext";

const fallbackAuth: AuthContextValue = {
  user: false,
  token: null,
  userLogin: () => undefined,
  logout: () => undefined,
};

export function useOptionalAuth(): AuthContextValue {
  return useContext(AuthContext) ?? fallbackAuth;
}
