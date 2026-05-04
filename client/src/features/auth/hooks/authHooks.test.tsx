import type { ReactElement, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { AuthContext } from "../../../store/AuthContext";
import { useLoginMutation } from "./useLoginMutation";
import { useRegisterMutation } from "./useRegisterMutation";

vi.mock("../../../services/authService", () => ({
  createProfile: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
}));

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
});
