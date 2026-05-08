import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createQueryWrapper } from "../../../test/renderHookWithClient";
import {
  followUser,
  getFollowStatus,
  getProfileFollowers,
  listFollows,
  unfollowById,
} from "../services/followService";
import {
  useFollowMutations,
  useFollowStatus,
  useFollows,
  useProfileFollowers,
} from "./followHooks";

vi.mock("../services/followService", () => ({
  followUser: vi.fn(),
  getFollowStatus: vi.fn(),
  getMyFollowers: vi.fn(),
  getMyFollowing: vi.fn(),
  getProfileFollowers: vi.fn(),
  getProfileFollowing: vi.fn(),
  listFollows: vi.fn(),
  unfollowById: vi.fn(),
}));

describe("follow hooks", () => {
  it("loads follow lists", async () => {
    vi.mocked(listFollows).mockResolvedValue([
      { id: 1, follower: 1, following: 2 },
    ]);

    const { result } = renderHook(() => useFollows("token"), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.data?.[0]?.id).toBe(1));
  });

  it("loads profile followers", async () => {
    vi.mocked(getProfileFollowers).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      page: 1,
      pageSize: 20,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
      results: [{
        id: 1,
        follower: 3,
        following: 2,
        follower_detail: {
          id: 3,
          email: "reader@example.com",
          display_name: "reader",
        },
      }],
    });

    const { result } = renderHook(() => useProfileFollowers("2", 1, "token"), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() =>
      expect(result.current.data?.results[0]?.follower_detail?.display_name).toBe("reader")
    );
  });

  it("loads follow status", async () => {
    vi.mocked(getFollowStatus).mockResolvedValue({
      id: 7,
      follower: 1,
      following: 2,
    });

    const { result } = renderHook(() => useFollowStatus("2", "token"), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.data?.id).toBe(7));
  });

  it("exposes follow mutations", async () => {
    vi.mocked(followUser).mockResolvedValue({ id: 1, follower: 1, following: 2 });
    vi.mocked(unfollowById).mockResolvedValue(undefined);

    const { result } = renderHook(() => useFollowMutations("token"), {
      wrapper: createQueryWrapper(),
    });

    await result.current.followUser(2);
    await result.current.unfollowById(1);

    expect(followUser).toHaveBeenCalledWith(2, "token");
    expect(unfollowById).toHaveBeenCalledWith(1, "token");
  });
});
