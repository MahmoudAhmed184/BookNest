import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCollections, getUserCollections } from "../../collections/services/collectionService";
import { getNotifications } from "../../notifications/services/notificationService";
import {
  getPreferences,
  getMyProfile,
  getProfile,
  getUserDataAggregate,
  getUserRatings,
  getUserReviews,
} from "../services/userService";
import { createQueryWrapper } from "../../../test/renderHookWithClient";
import { useNavbarProfile } from "./useNavbarProfile";
import { useNotifications } from "../../notifications/hooks/useNotifications";
import { useProfileActions } from "./useProfileActions";
import { useProfilePageData } from "./useProfilePageData";
import { useSettingsProfile } from "../../settings/hooks/useSettingsProfile";
import { useUserProfilePageData } from "./useUserProfilePageData";
import type { BookRating, BookReview } from "../../catalog/types/book";
import type { ReadingCollection } from "../../collections/types/collection";
import type { Notification } from "../../notifications/types/notification";
import type { Profile, UserPreference } from "../types/user";

vi.mock("../../collections/services/collectionService", () => ({
  getCollections: vi.fn(),
  getUserCollections: vi.fn(),
}));

vi.mock("../../notifications/services/notificationService", () => ({
  getNotifications: vi.fn(),
  markAllNotificationsRead: vi.fn(),
}));

vi.mock("../../catalog/services/bookService", () => ({
  deleteBook: vi.fn(),
}));

vi.mock("../services/userService", () => ({
  createProfileInterest: vi.fn(),
  createUserSocialLink: vi.fn(),
  deleteProfileInterest: vi.fn(),
  deleteUserSocialLink: vi.fn(),
  deleteReview: vi.fn(),
  getMyProfile: vi.fn(),
  getPreferences: vi.fn(),
  getProfile: vi.fn(),
  getUserDataAggregate: vi.fn(),
  getUserRatings: vi.fn(),
  getUserReviews: vi.fn(),
  updateBio: vi.fn(),
  updatePreferences: vi.fn(),
  updateProfileInterest: vi.fn(),
  updateUser: vi.fn(),
  updateUserSocialLink: vi.fn(),
  uploadProfilePicture: vi.fn(),
}));

const user: Profile = {
  id: 1,
  user: {
    id: 31,
    email: "reader@example.com",
    display_name: "reader",
  },
  handle: "reader",
};
const preferences: UserPreference = {
  id: 1,
  user: 31,
  email_notifications_enabled: true,
  in_app_notifications_enabled: true,
  notify_on_follow: true,
  notify_on_review_vote: true,
  profile_public: true,
  show_ratings_publicly: true,
  personalized_recommendations_enabled: true,
  external_enrichment_enabled: true,
  search_history_enabled: true,
  mature_content_enabled: false,
  default_collection_privacy: "private",
  timezone: "UTC",
};

function review(id: number, body: string): BookReview {
  return { id, user: 31, book: 1, body };
}

function rating(id: number, value: number): BookRating {
  return { id, user: 31, book: 1, value };
}

function collection(id: number, name: string): ReadingCollection {
  return {
    id,
    owner: 31,
    name,
    list_type: "custom",
    privacy: "private",
  };
}

function notification(id: number, action: string): Notification {
  return {
    id,
    recipient: 31,
    notification_type: "social",
    action,
    is_read: false,
    created_at: "now",
  };
}

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

    await waitFor(() => expect(result.current.profile?.handle).toBe("reader"));
  });

  it("loads current profile page data", async () => {
    vi.mocked(getMyProfile).mockResolvedValue(user);
    vi.mocked(getUserDataAggregate).mockResolvedValue({
      profile: user,
      reading_collections: [collection(1, "Shelf")],
      ratings: [rating(1, 5)],
      reviews: [review(1, "Nice")],
    });
    vi.mocked(getCollections).mockResolvedValue([collection(1, "Shelf")]);

    const { result } = renderHook(() => useProfilePageData(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.user?.handle).toBe("reader"));
    await waitFor(() => expect(result.current.collections?.[0]?.name).toBe("Shelf"));
  });

  it("loads public profile page data", async () => {
    vi.mocked(getProfile).mockResolvedValue(user);
    vi.mocked(getUserDataAggregate).mockResolvedValue({
      profile: user,
      reading_collections: [collection(2, "Public")],
      ratings: [rating(2, 4)],
      reviews: [review(2, "Public")],
    });
    vi.mocked(getUserReviews).mockResolvedValue([review(2, "Public")]);
    vi.mocked(getUserRatings).mockResolvedValue([rating(2, 4)]);
    vi.mocked(getUserCollections).mockResolvedValue([collection(2, "Public")]);

    const { result } = renderHook(() => useUserProfilePageData("1"), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.user?.handle).toBe("reader"));
    expect(result.current.collections?.[0]?.name).toBe("Public");
  });

  it("loads notifications", async () => {
    vi.mocked(getNotifications).mockResolvedValue([notification(1, "updated")]);

    const { result } = renderHook(() => useNotifications("token"), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.notifications).toHaveLength(1));
  });

  it("exposes profile actions and settings profile state", async () => {
    vi.mocked(getMyProfile).mockResolvedValue(user);
    vi.mocked(getPreferences).mockResolvedValue(preferences);

    const actions = renderHook(() => useProfileActions(), {
      wrapper: createQueryWrapper(),
    });
    const settings = renderHook(() => useSettingsProfile("token"), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(settings.result.current.user?.handle).toBe("reader"));
    expect(typeof actions.result.current.deleteBookFromShelf).toBe("function");
    expect(typeof settings.result.current.uploadProfilePicture).toBe("function");
  });
});
