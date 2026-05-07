import { createContext } from "react";

export interface AuthContextValue {
  user: boolean;
  token: string | null;
  userLogin: (userData: unknown, authToken: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
