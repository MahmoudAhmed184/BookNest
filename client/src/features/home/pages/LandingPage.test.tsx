import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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

vi.mock("../../catalog/services/bookService", () => ({
  clickRecommendation: vi.fn(),
  createRecommendationFeedback: vi.fn(),
  dismissRecommendation: vi.fn(),
  getGenreBooks: vi.fn(() =>
    Promise.resolve({ count: 0, next: null, previous: null, results: [] })
  ),
  getGenres: vi.fn(() => Promise.resolve([])),
  getNewReleaseBooks: vi.fn(() => Promise.resolve([])),
  getPopularBooks: vi.fn(() => Promise.resolve([])),
  getRecommendedBooks: vi.fn(() => Promise.resolve([])),
}));

function renderLanding(): void {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("LandingPage", () => {
  it("renders the primary landing links", () => {
    renderLanding();

    expect(
      screen.getByRole("heading", {
        name: "BookNest",
      })
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Explore catalog" }).getAttribute("href")
    ).toBe("/explore");
    expect(
      screen.getByRole("link", { name: "Create account" }).getAttribute("href")
    ).toBe("/register");
  });
});
