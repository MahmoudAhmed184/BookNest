import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Landing from "./LandingPage";

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
