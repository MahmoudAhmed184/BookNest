import type { ReactElement, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { API_BASE_URL } from "../../../config/env";
import {
  ACCESS_TOKEN_STORAGE_KEY,
  apiClient,
  type ProfileRequiredRedirectPayload,
  REFRESH_TOKEN_STORAGE_KEY,
  setProfileRequiredRedirectHandler,
} from "../../../lib/axios";
import { AuthContext } from "../store/authContext";
import { useLoginMutation } from "./useLoginMutation";
import { useRegisterMutation } from "./useRegisterMutation";

vi.mock("../services/authService", () => ({
  createProfile: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
}));

function responseFor<TData>(
  config: InternalAxiosRequestConfig,
  status: number,
  data: TData
): AxiosResponse<TData> {
  return {
    data,
    status,
    statusText: String(status),
    headers: {},
    config,
  };
}

function installMemoryStorage(initialEntries: Record<string, string>): void {
  const storage = new Map<string, string>(Object.entries(initialEntries));

  vi.stubGlobal("localStorage", {
    getItem: vi.fn((key: string) => storage.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      storage.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      storage.delete(key);
    }),
    clear: vi.fn(() => {
      storage.clear();
    }),
    key: vi.fn((index: number) => Array.from(storage.keys())[index] ?? null),
    get length() {
      return storage.size;
    },
  });
}

function createAuthWrapper(): (props: { children: ReactNode }) => ReactElement {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return function AuthWrapper({ children }: { children: ReactNode }): ReactElement {
    return (
      <MemoryRouter>
        <AuthContext.Provider
          value={{
            user: false,
            token: null,
            userLogin: vi.fn(),
            logout: vi.fn(),
          }}
        >
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </AuthContext.Provider>
      </MemoryRouter>
    );
  };
}

describe("auth hooks", () => {
  it("exposes login mutation state", () => {
    const { result } = renderHook(() => useLoginMutation(), {
      wrapper: createAuthWrapper(),
    });

    expect(result.current.isPending).toBe(false);
    expect(typeof result.current.submitLogin).toBe("function");
  });

  it("exposes register mutation state", () => {
    const { result } = renderHook(() => useRegisterMutation(), {
      wrapper: createAuthWrapper(),
    });

    expect(result.current.isPending).toBe(false);
    expect(typeof result.current.submitRegister).toBe("function");
  });

  it("refreshes the access token and retries a 401 request once", async () => {
    installMemoryStorage({
      [ACCESS_TOKEN_STORAGE_KEY]: "expired-access",
      [REFRESH_TOKEN_STORAGE_KEY]: "refresh-token",
    });

    const originalAdapter = apiClient.defaults.adapter;
    const postSpy = vi.spyOn(axios, "post").mockResolvedValue({
      data: { access: "new-access" },
    });
    let requestCount = 0;

    const adapter: AxiosAdapter = async (config) => {
      const requestConfig = config as InternalAxiosRequestConfig;
      requestCount += 1;

      if (requestCount === 1) {
        throw new AxiosError(
          "Unauthorized",
          AxiosError.ERR_BAD_REQUEST,
          requestConfig,
          undefined,
          responseFor(requestConfig, 401, { detail: "expired" })
        );
      }

      return responseFor(requestConfig, 200, {
        ok: true,
        authorization: AxiosHeaders.from(requestConfig.headers).get("Authorization"),
      });
    };

    apiClient.defaults.adapter = adapter;

    try {
      const response = await apiClient.get<{
        ok: boolean;
        authorization: string | null;
      }>("/protected-resource/");

      expect(response.data).toEqual({
        ok: true,
        authorization: "Bearer new-access",
      });
      expect(requestCount).toBe(2);
      expect(postSpy).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/v1/auth/tokens/refresh/`,
        { refresh: "refresh-token" }
      );
      expect(localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBe("new-access");
    } finally {
      if (originalAdapter === undefined) {
        delete apiClient.defaults.adapter;
      } else {
        apiClient.defaults.adapter = originalAdapter;
      }
      postSpy.mockRestore();
    }
  });

  it("redirects profile-required 403 envelopes with action metadata", async () => {
    const originalAdapter = apiClient.defaults.adapter;
    const redirectHandler = vi.fn<
      (payload: ProfileRequiredRedirectPayload) => void
    >();

    const adapter: AxiosAdapter = async (config) => {
      const requestConfig = config as InternalAxiosRequestConfig;

      throw new AxiosError(
        "Forbidden",
        AxiosError.ERR_BAD_REQUEST,
        requestConfig,
        undefined,
        responseFor(requestConfig, 403, {
          errors: {
            detail: "You must create a profile before accessing this feature",
          },
          meta: {
            action_required: "create_profile",
            profile_creation_url: "/register",
          },
        })
      );
    };

    setProfileRequiredRedirectHandler(redirectHandler);
    apiClient.defaults.adapter = adapter;

    try {
      await expect(apiClient.get("/profile-required/")).rejects.toBeInstanceOf(
        AxiosError
      );
      expect(redirectHandler).toHaveBeenCalledWith({
        requiresProfile: true,
        actionRequired: "create_profile",
        profileCreationUrl: "/register",
      });
    } finally {
      if (originalAdapter === undefined) {
        delete apiClient.defaults.adapter;
      } else {
        apiClient.defaults.adapter = originalAdapter;
      }
      setProfileRequiredRedirectHandler(null);
    }
  });
});
