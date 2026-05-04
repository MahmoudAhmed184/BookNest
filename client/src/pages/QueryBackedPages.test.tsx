import type { ReactElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import BookPage from "./Catalog/BookPage";
import Explore from "./Catalog/ExplorePage";
import Search from "./Catalog/SearchPage";
import Notifications from "./Profile/NotificationsPage";
import Profile from "./Profile/ProfilePage";
import Settings from "./Profile/SettingsPage";
import UserProfile from "./Profile/UserProfilePage";
import { useBookActions } from "../features/catalog/hooks/useBookActions";
import { useBookPageData } from "../features/catalog/hooks/useBookPageData";
import { useExploreCatalog } from "../features/catalog/hooks/useExploreCatalog";
import { useSearchBooks } from "../features/catalog/hooks/useSearchBooks";
import { useNotifications } from "../features/profile/hooks/useNotifications";
import { useProfileActions } from "../features/profile/hooks/useProfileActions";
import { useProfilePageData } from "../features/profile/hooks/useProfilePageData";
import { useSettingsProfile } from "../features/profile/hooks/useSettingsProfile";
import { useUserProfilePageData } from "../features/profile/hooks/useUserProfilePageData";

vi.mock("../features/catalog/hooks/useExploreCatalog", () => ({
  useExploreCatalog: vi.fn(),
}));
vi.mock("../features/catalog/hooks/useSearchBooks", () => ({
  useSearchBooks: vi.fn(),
}));
vi.mock("../features/catalog/hooks/useBookPageData", () => ({
  useBookPageData: vi.fn(),
}));
vi.mock("../features/catalog/hooks/useBookActions", () => ({
  useBookActions: vi.fn(),
}));
vi.mock("../features/profile/hooks/useProfilePageData", () => ({
  useProfilePageData: vi.fn(),
}));
vi.mock("../features/profile/hooks/useUserProfilePageData", () => ({
  useUserProfilePageData: vi.fn(),
}));
vi.mock("../features/profile/hooks/useProfileActions", () => ({
  useProfileActions: vi.fn(),
}));
vi.mock("../features/profile/hooks/useSettingsProfile", () => ({
  useSettingsProfile: vi.fn(),
}));
vi.mock("../features/profile/hooks/useNotifications", () => ({
  useNotifications: vi.fn(),
}));

function renderPage(page: ReactElement): void {
  cleanup();
  render(<MemoryRouter>{page}</MemoryRouter>);
}

const refetch = vi.fn();
const user = { id: 1, user_id: 31, username: "reader", bio: "Bio" };

describe("query-backed pages", () => {
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
    vi.mocked(useBookActions).mockReturnValue({
      isAddingBook: false,
      isSubmittingReview: false,
      addBook: vi.fn(),
      submitReview: vi.fn(),
    });
    vi.mocked(useProfileActions).mockReturnValue({
      isDeletingBook: false,
      isDeletingReview: false,
      deleteBookFromShelf: vi.fn(),
      deleteProfileReview: vi.fn(),
    });
  });

  it("renders Explore loading, error, and success states", () => {
    vi.mocked(useExploreCatalog).mockReturnValue({
      books: [],
      recommendations: [],
      isBooksLoading: true,
      isBooksFetching: false,
      isBooksError: false,
      isRecommendationsLoading: false,
      isRecommendationsFetching: false,
      isRecommendationsError: false,
      refetchBooks: refetch,
      refetchRecommendations: refetch,
    });
    renderPage(<Explore />);
    expect(screen.getByText("Explore")).toBeTruthy();

    vi.mocked(useExploreCatalog).mockReturnValue({
      books: [],
      recommendations: [],
      isBooksLoading: false,
      isBooksFetching: false,
      isBooksError: true,
      isRecommendationsLoading: false,
      isRecommendationsFetching: false,
      isRecommendationsError: false,
      refetchBooks: refetch,
      refetchRecommendations: refetch,
    });
    renderPage(<Explore />);
    expect(screen.getByText("Books could not be loaded")).toBeTruthy();

    vi.mocked(useExploreCatalog).mockReturnValue({
      books: [{ isbn13: "1", title: "Catalog Book" }],
      recommendations: [],
      isBooksLoading: false,
      isBooksFetching: false,
      isBooksError: false,
      isRecommendationsLoading: false,
      isRecommendationsFetching: false,
      isRecommendationsError: false,
      refetchBooks: refetch,
      refetchRecommendations: refetch,
    });
    renderPage(<Explore />);
    expect(screen.getByText("Catalog Book")).toBeTruthy();
  });

  it("renders Search loading, error, and success states", () => {
    vi.mocked(useSearchBooks).mockReturnValue({
      books: [],
      isLoading: true,
      isFetching: true,
      isError: false,
      hasData: false,
      refetch,
    });
    renderPage(<Search />);
    expect(screen.getByText("Search Books")).toBeTruthy();

    vi.mocked(useSearchBooks).mockReturnValue({
      books: [],
      isLoading: false,
      isFetching: false,
      isError: true,
      hasData: false,
      refetch,
    });
    renderPage(<Search />);
    expect(screen.getByText("Search is unavailable")).toBeTruthy();

    vi.mocked(useSearchBooks).mockReturnValue({
      books: [{ isbn13: "2", title: "Search Book" }],
      isLoading: false,
      isFetching: false,
      isError: false,
      hasData: true,
      refetch,
    });
    renderPage(<Search />);
    expect(screen.getByText("Search Book")).toBeTruthy();
  });

  it("renders BookPage loading, error, and success states", () => {
    vi.mocked(useBookPageData).mockReturnValue({
      isBookLoading: true,
      isBookFetching: false,
      isBookError: false,
      isReviewsLoading: false,
      isReviewsFetching: false,
      isReviewsError: false,
      isRatingsError: false,
      refetchBook: refetch,
      refetchReviews: refetch,
      refetchRatings: refetch,
    });
    renderPage(<BookPage />);
    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);

    vi.mocked(useBookPageData).mockReturnValue({
      isBookLoading: false,
      isBookFetching: false,
      isBookError: true,
      isReviewsLoading: false,
      isReviewsFetching: false,
      isReviewsError: false,
      isRatingsError: false,
      refetchBook: refetch,
      refetchReviews: refetch,
      refetchRatings: refetch,
    });
    renderPage(<BookPage />);
    expect(screen.getByText("Book details are unavailable")).toBeTruthy();

    vi.mocked(useBookPageData).mockReturnValue({
      book: { isbn13: "1", title: "Book Detail" },
      reviews: [],
      ratings: [],
      isBookLoading: false,
      isBookFetching: false,
      isBookError: false,
      isReviewsLoading: false,
      isReviewsFetching: false,
      isReviewsError: false,
      isRatingsError: false,
      refetchBook: refetch,
      refetchReviews: refetch,
      refetchRatings: refetch,
    });
    renderPage(<BookPage />);
    expect(screen.getByText("Book Detail")).toBeTruthy();
  });

  it("renders profile-backed pages in loading, error, and success states", () => {
    vi.mocked(useProfilePageData).mockReturnValue(profileState({ isUserLoading: true }));
    renderPage(<Profile />);
    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);

    vi.mocked(useProfilePageData).mockReturnValue(profileState({ isUserError: true }));
    renderPage(<Profile />);
    expect(screen.getByText("Profile could not be loaded")).toBeTruthy();

    vi.mocked(useProfilePageData).mockReturnValue(profileState({ user }));
    renderPage(<Profile />);
    expect(screen.getByText("reader")).toBeTruthy();
  });

  it("renders user profile loading, error, and success states", () => {
    vi.mocked(useUserProfilePageData).mockReturnValue(profileState({ isUserLoading: true }));
    renderPage(<UserProfile />);
    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);

    vi.mocked(useUserProfilePageData).mockReturnValue(profileState({ isUserError: true }));
    renderPage(<UserProfile />);
    expect(screen.getByText("Profile could not be loaded")).toBeTruthy();

    vi.mocked(useUserProfilePageData).mockReturnValue(profileState({ user }));
    renderPage(<UserProfile />);
    expect(screen.getByText("reader")).toBeTruthy();
  });

  it("renders Settings loading, error, and success states", () => {
    vi.mocked(useSettingsProfile).mockReturnValue(settingsState({ isLoading: true }));
    renderPage(<Settings />);
    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);

    vi.mocked(useSettingsProfile).mockReturnValue(settingsState({ isError: true }));
    renderPage(<Settings />);
    expect(screen.getByText("Settings could not be loaded")).toBeTruthy();

    vi.mocked(useSettingsProfile).mockReturnValue(settingsState({ user }));
    renderPage(<Settings />);
    expect(screen.getByText("Manage your BookNest account, profile, and security details.")).toBeTruthy();
  });

  it("renders Notifications loading, error, and success states", () => {
    vi.mocked(useNotifications).mockReturnValue({
      notifications: [],
      isLoading: true,
      isFetching: false,
      isError: false,
      refetch,
    });
    renderPage(<Notifications />);
    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);

    vi.mocked(useNotifications).mockReturnValue({
      notifications: [],
      isLoading: false,
      isFetching: false,
      isError: true,
      refetch,
    });
    renderPage(<Notifications />);
    expect(screen.getByText("Notifications could not be loaded")).toBeTruthy();

    vi.mocked(useNotifications).mockReturnValue({
      notifications: [
        { id: 1, recipient: 1, verb: "New follower", read: false, timestamp: "now" },
      ],
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch,
    });
    renderPage(<Notifications />);
    expect(screen.getByText("New follower")).toBeTruthy();
  });
});

function profileState(overrides = {}) {
  return {
    user: undefined,
    reviews: [],
    ratings: [],
    collections: [],
    isUserLoading: false,
    isUserFetching: false,
    isUserError: false,
    isReviewsLoading: false,
    isReviewsFetching: false,
    isReviewsError: false,
    isRatingsError: false,
    isCollectionsLoading: false,
    isCollectionsFetching: false,
    isCollectionsError: false,
    refetchUser: refetch,
    refetchReviews: refetch,
    refetchRatings: refetch,
    refetchCollections: refetch,
    ...overrides,
  };
}

function settingsState(overrides = {}) {
  return {
    user: undefined,
    isLoading: false,
    isFetching: false,
    isError: false,
    isSavingProfile: false,
    isUploadingPicture: false,
    refetch,
    updateProfile: vi.fn(),
    uploadProfilePicture: vi.fn(),
    ...overrides,
  };
}
