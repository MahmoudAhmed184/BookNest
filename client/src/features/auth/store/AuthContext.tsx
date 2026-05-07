import {
  useCallback,
  useEffect,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

import {
  clearStoredAuthTokens,
  getStoredAccessToken,
  getStoredRefreshToken,
  refreshAccessToken,
  setStoredAuthTokens,
  verifyAccessToken,
} from "../../../lib/axios";
import { routePaths } from "../../../routes/paths";
import { logoutCurrentSession } from "../services/authService";
import type { AuthenticatedUser } from "../types/auth";
import { AuthContext } from "./authContext";

interface AuthProviderProps {
  children: ReactNode;
}

function redirectToLogin(): void {
  if (globalThis.location?.pathname !== routePaths.login) {
    globalThis.location.assign(routePaths.login);
  }
}

export function AuthProvider({ children }: AuthProviderProps): ReactElement {
  const [token, setToken] = useState<string | null>(getStoredAccessToken);
  const [refreshToken, setRefreshToken] = useState<string | null>(
    getStoredRefreshToken
  );
  const [authUser, setAuthUser] = useState<AuthenticatedUser | null>(null);
  const [user, setUser] = useState<boolean>(Boolean(getStoredAccessToken()));

  const clearLocalSession = useCallback((): void => {
    setUser(false);
    setToken(null);
    setRefreshToken(null);
    setAuthUser(null);
    clearStoredAuthTokens();
  }, []);

  useEffect(() => {
    let isActive = true;

    async function verifyStoredSession(): Promise<void> {
      const storedAccessToken = getStoredAccessToken();
      const storedRefreshToken = getStoredRefreshToken();

      if (!storedAccessToken) {
        return;
      }

      try {
        await verifyAccessToken(storedAccessToken);
        if (!isActive) return;

        setUser(true);
        setToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);
      } catch {
        if (!storedRefreshToken) {
          if (!isActive) return;

          clearLocalSession();
          redirectToLogin();
          return;
        }

        try {
          const nextAccessToken = await refreshAccessToken(storedRefreshToken);
          if (!isActive) return;

          setUser(true);
          setToken(nextAccessToken);
          setRefreshToken(getStoredRefreshToken());
        } catch {
          if (!isActive) return;

          clearLocalSession();
          redirectToLogin();
        }
      }
    }

    void verifyStoredSession();

    return () => {
      isActive = false;
    };
  }, [clearLocalSession]);

  const userLogin = (
    userData: AuthenticatedUser | null,
    authToken: string,
    nextRefreshToken?: string | null
  ): void => {
    setUser(true);
    setToken(authToken);
    setAuthUser(userData);
    setRefreshToken(nextRefreshToken ?? getStoredRefreshToken());
    setStoredAuthTokens(authToken, nextRefreshToken);
  };

  const logout = (): void => {
    const tokenToRevoke = refreshToken ?? getStoredRefreshToken();

    void logoutCurrentSession(tokenToRevoke)
      .catch(() => undefined)
      .finally(clearLocalSession);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, authUser, refreshToken, userLogin, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
