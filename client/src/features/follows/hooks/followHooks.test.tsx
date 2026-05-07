import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createQueryWrapper } from "../../../test/renderHookWithClient";
import {
  followProfile,
  getProfileFollowers,
  listFollows,
  unfollowById,
} from "../services/followService";
import {
  useFollowMutations,
  useFollows,
  useProfileFollowers,
} from "./followHooks";

vi.mock("../services/followService", () => ({
  followProfile: vi.fn(),
  getMyFollowers: vi.fn(),
  getMyFollowing: vi.fn(),
  getProfileFollowers: vi.fn(),
  getProfileFollowing: vi.fn(),
  listFollows: vi.fn(),
  unfollowById: vi.fn(),
}));

describe("follow hooks", () => {
  it("loads follow lists", async () => {
    vi.mocked(listFollows).mockResolvedValue([{ id: 1, followed: 2 }]);

    const { result } = renderHook(() => useFollows("token"), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.data?.[0]?.id).toBe(1));
  });

  it("loads profile followers", async () => {
    vi.mocked(getProfileFollowers).mockResolvedValue([
      { id: 1, profile: { id: 2, user_id: 3, username: "reader" } },
    ]);

    const { result } = renderHook(() => useProfileFollowers("2", "token"), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.data?.[0]?.profile.username).toBe("reader"));
  });

  it("exposes follow mutations", async () => {
    vi.mocked(followProfile).mockResolvedValue({ id: 1, followed: 2 });
    vi.mocked(unfollowById).mockResolvedValue(undefined);

    const { result } = renderHook(() => useFollowMutations("token"), {
      wrapper: createQueryWrapper(),
    });

    await result.current.followProfile(2);
    await result.current.unfollowById(1);

    expect(followProfile).toHaveBeenCalledWith(2, "token");
    expect(unfollowById).toHaveBeenCalledWith(1, "token");
  });
});
