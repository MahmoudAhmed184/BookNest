import { useState, type ReactElement, type ReactNode } from "react";

import { AuthContext } from "./authContext";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): ReactElement {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [user, setUser] = useState<boolean>(
    localStorage.getItem("token") ? true : false
  );

  const userLogin = (_userData: unknown, authToken: string): void => {
    setUser(true);
    setToken(authToken);
    localStorage.setItem("token", authToken);
  };

  const logout = (): void => {
    setUser(false);
    setToken(null);
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, token, userLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
