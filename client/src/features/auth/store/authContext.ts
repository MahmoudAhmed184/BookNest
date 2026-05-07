import { createContext } from "react";
import type { AuthenticatedUser } from "../types/auth";

export interface AuthContextValue {
  user: boolean;
  token: string | null;
  authUser?: AuthenticatedUser | null;
  refreshToken?: string | null;
  userLogin: (
    userData: AuthenticatedUser | null,
    authToken: string,
    refreshToken?: string | null
  ) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
