import { beforeEach, describe, expect, it, vi } from "vitest";

import { getData } from "../../../lib/axios";
import type { ProfileOverview } from "../types/user";
import {
  getProfileOverviewByHandle,
  getUserDataAggregate,
} from "./userService";

vi.mock("../../../lib/axios", () => ({
  authHeaders: vi.fn((token?: string | null) =>
    token ? { Authorization: `Bearer ${token}` } : {}
  ),
  deleteData: vi.fn(),
  getData: vi.fn(),
  patchData: vi.fn(),
  postData: vi.fn(),
  throwApiError: vi.fn((error: unknown): never => {
    throw error instanceof Error ? error : new Error(String(error));
  }),
}));

const overview: ProfileOverview = {
  user: {
    id: 31,
    email: "reader@example.com",
    display_name: "Reader",
  },
  profile: {
    id: 1,
    user: {
      id: 31,
      email: "reader@example.com",
      display_name: "Reader",
    },
    handle: "mahmoud",
  },
  viewer_context: {
    is_self: false,
    is_following: false,
    can_view_private: false,
  },
  stats: {
    followers_count: 0,
    following_count: 0,
    reviews_count: 0,
    ratings_count: 0,
    collections_count: 0,
    books_read_count: 0,
  },
  recent_reviews: [],
  recent_ratings: [],
  recent_collections: [],
};

describe("userService profile overview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getData).mockResolvedValue(overview);
  });

  it("calls the handle overview endpoint with an encoded handle", async () => {
    await getProfileOverviewByHandle("mahmoud reader", "token");

    expect(getData).toHaveBeenCalledWith(
      "/api/v1/profiles/by-handle/mahmoud%20reader/overview/",
      { headers: { Authorization: "Bearer token" } }
    );
  });

  it("resolves public profile aggregate data by handle", async () => {
    await getUserDataAggregate("mahmoud", "token");

    expect(getData).toHaveBeenCalledWith(
      "/api/v1/profiles/by-handle/mahmoud/overview/",
      { headers: { Authorization: "Bearer token" } }
    );
  });

  it("keeps numeric profile params on the existing id overview endpoint", async () => {
    await getUserDataAggregate("31", "token");

    expect(getData).toHaveBeenCalledWith(
      "/api/v1/users/31/profile-overview/",
      { headers: { Authorization: "Bearer token" } }
    );
  });
});
