import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { AuthContext } from "../features/auth/store/authContext";
import { RequireAuth } from "./RequireAuth";
import { routePaths } from "./paths";

function renderGuard(user: boolean, token: string | null): void {
  render(
    <AuthContext.Provider
      value={{
        user,
        token,
        userLogin: vi.fn(),
        logout: vi.fn(),
      }}
    >
      <MemoryRouter initialEntries={[routePaths.settings]}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path={routePaths.settings} element={<h1>Settings</h1>} />
          </Route>
          <Route path={routePaths.login} element={<h1>Login</h1>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe("RequireAuth", () => {
  it("renders child routes for authenticated users", () => {
    renderGuard(true, "token");

    expect(screen.getByRole("heading", { name: "Settings" })).toBeTruthy();
  });

  it("redirects guests to login", () => {
    renderGuard(false, null);

    expect(screen.getByRole("heading", { name: "Login" })).toBeTruthy();
  });
});
