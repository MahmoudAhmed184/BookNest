import { describe, expect, it } from "vitest";

import { routeBuilders } from "./paths";

describe("routeBuilders", () => {
  it("builds canonical public profile URLs with handles", () => {
    expect(routeBuilders.userProfile("mahmoud")).toBe("/profile/mahmoud");
  });
});
