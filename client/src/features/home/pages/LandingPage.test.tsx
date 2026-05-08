import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Landing from "./LandingPage";

vi.mock("../../catalog/hooks/useLandingCatalog", () => ({
  useLandingCatalog: () => ({
    books: [{ id: 1, isbn_13: "1", title: "Featured Book" }],
    featuredBook: { id: 1, isbn_13: "1", title: "Featured Book" },
    isLoading: false,
    isFetching: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

describe("LandingPage", () => {
  it("renders the primary landing links", () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", {
        name: "Discover Your Next Favorite Book",
      })
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Get Started" }).getAttribute("href")
    ).toBe("/login");
    expect(
      screen.getByRole("link", { name: "Explore Now" }).getAttribute("href")
    ).toBe("/explore");
  });
});
