import {
  createContext,
  useContext,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

interface AuthContextValue {
  user: boolean;
  token: string | null;
  userLogin: (userData: unknown, authToken: string) => void;
  logout: () => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps): ReactElement {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [user, setUser] = useState<boolean>(
    localStorage.getItem("token") ? true : false
  );

  const userLogin = (_userData: unknown, authToken: string): void => {
    setUser(true);
    console.log(user);

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

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
