import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCollections, getUserCollections } from "../../../services/collectionService";
import { getNotifications } from "../../../services/notificationService";
import {
  getMyProfile,
  getProfile,
  getUserRatings,
  getUserReviews,
} from "../../../services/userService";
import { createQueryWrapper } from "../../../test/renderHookWithClient";
import { useNavbarProfile } from "./useNavbarProfile";
import { useNotifications } from "./useNotifications";
import { useProfileActions } from "./useProfileActions";
import { useProfilePageData } from "./useProfilePageData";
import { useSettingsProfile } from "./useSettingsProfile";
import { useUserProfilePageData } from "./useUserProfilePageData";

vi.mock("../../../services/collectionService", () => ({
  getCollections: vi.fn(),
  getUserCollections: vi.fn(),
}));

vi.mock("../../../services/notificationService", () => ({
  getNotifications: vi.fn(),
}));

vi.mock("../../../services/bookService", () => ({
  deleteBook: vi.fn(),
}));

vi.mock("../../../services/userService", () => ({
  deleteReview: vi.fn(),
  getMyProfile: vi.fn(),
  getProfile: vi.fn(),
  getUserRatings: vi.fn(),
  getUserReviews: vi.fn(),
  updateBio: vi.fn(),
  updateUser: vi.fn(),
  uploadProfilePicture: vi.fn(),
}));

const user = { id: 1, user_id: 31, username: "reader" };

describe("profile hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => "token"),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    });
  });

  it("loads navbar profile when enabled", async () => {
    vi.mocked(getMyProfile).mockResolvedValue(user);

    const { result } = renderHook(() => useNavbarProfile(true), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.profile?.username).toBe("reader"));
  });

  it("loads current profile page data", async () => {
    vi.mocked(getMyProfile).mockResolvedValue(user);
    vi.mocked(getUserReviews).mockResolvedValue([{ review_id: 1, review_text: "Nice" }]);
    vi.mocked(getUserRatings).mockResolvedValue([{ rate_id: 1, rate: 5 }]);
    vi.mocked(getCollections).mockResolvedValue([{ list_id: 1, name: "Shelf" }]);

    const { result } = renderHook(() => useProfilePageData(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.user?.username).toBe("reader"));
    await waitFor(() => expect(result.current.collections?.[0]?.name).toBe("Shelf"));
  });

  it("loads public profile page data", async () => {
    vi.mocked(getProfile).mockResolvedValue(user);
    vi.mocked(getUserReviews).mockResolvedValue([{ review_id: 2, review_text: "Public" }]);
    vi.mocked(getUserRatings).mockResolvedValue([{ rate_id: 2, rate: 4 }]);
    vi.mocked(getUserCollections).mockResolvedValue([{ list_id: 2, name: "Public" }]);

    const { result } = renderHook(() => useUserProfilePageData("1"), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.user?.username).toBe("reader"));
    expect(result.current.collections?.[0]?.name).toBe("Public");
  });

  it("loads notifications", async () => {
    vi.mocked(getNotifications).mockResolvedValue([
      { id: 1, recipient: 1, verb: "updated", read: false, timestamp: "now" },
    ]);

    const { result } = renderHook(() => useNotifications("token"), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.notifications).toHaveLength(1));
  });

  it("exposes profile actions and settings profile state", async () => {
    vi.mocked(getMyProfile).mockResolvedValue(user);

    const actions = renderHook(() => useProfileActions(), {
      wrapper: createQueryWrapper(),
    });
    const settings = renderHook(() => useSettingsProfile(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(settings.result.current.user?.username).toBe("reader"));
    expect(typeof actions.result.current.deleteBookFromShelf).toBe("function");
    expect(typeof settings.result.current.uploadProfilePicture).toBe("function");
  });
});
