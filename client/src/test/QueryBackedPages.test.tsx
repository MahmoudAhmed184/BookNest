import type { ReactElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import BookPage from "../features/catalog/pages/BookPage";
import CollectionDetailPage from "../features/collections/pages/CollectionDetailPage";
import CollectionsPage from "../features/collections/pages/CollectionsPage";
import Explore from "../features/catalog/pages/ExplorePage";
import Search from "../features/catalog/pages/SearchPage";
import Notifications from "../features/notifications/pages/NotificationsPage";
import Profile from "../features/profile/pages/ProfilePage";
import Settings from "../features/settings/pages/SettingsPage";
import UserProfile from "../features/profile/pages/UserProfilePage";
import { useBookActions } from "../features/catalog/hooks/useBookActions";
import { useBookPageData } from "../features/catalog/hooks/useBookPageData";
import { useExploreCatalog } from "../features/catalog/hooks/useExploreCatalog";
import { useRelatedBooks } from "../features/catalog/hooks/useRelatedBooks";
import { useSearchBooks } from "../features/catalog/hooks/useSearchBooks";
import {
  useCollectionDetail,
  useCollections,
} from "../features/collections/hooks/useCollections";
import { useNotifications } from "../features/notifications/hooks/useNotifications";
import { useProfileActions } from "../features/profile/hooks/useProfileActions";
import { useProfilePageData } from "../features/profile/hooks/useProfilePageData";
import { useSettingsProfile } from "../features/settings/hooks/useSettingsProfile";
import { useUserProfilePageData } from "../features/profile/hooks/useUserProfilePageData";
import { AuthContext } from "../features/auth/store/authContext";
import type { OffsetPaginatedResponse } from "../types/api";

vi.mock("../features/catalog/hooks/useExploreCatalog", () => ({
  useExploreCatalog: vi.fn(),
}));
vi.mock("../features/catalog/hooks/useSearchBooks", () => ({
  useSearchBooks: vi.fn(),
}));
vi.mock("../features/catalog/hooks/useBookPageData", () => ({
  useBookPageData: vi.fn(),
}));
vi.mock("../features/catalog/hooks/useRelatedBooks", () => ({
  useRelatedBooks: vi.fn(),
}));
vi.mock("../features/catalog/hooks/useBookActions", () => ({
  useBookActions: vi.fn(),
}));
vi.mock("../features/collections/hooks/useCollections", () => ({
  useCollectionDetail: vi.fn(),
  useCollections: vi.fn(),
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
vi.mock("../features/settings/hooks/useSettingsProfile", () => ({
  useSettingsProfile: vi.fn(),
}));
vi.mock("../features/notifications/hooks/useNotifications", () => ({
  useNotifications: vi.fn(),
}));

function renderPage(page: ReactElement): void {
  cleanup();
  render(
    <AuthContext.Provider
      value={{
        user: true,
        token: "token",
        userLogin: vi.fn(),
        logout: vi.fn(),
      }}
    >
      <MemoryRouter>{page}</MemoryRouter>
    </AuthContext.Provider>
  );
}

const refetch = vi.fn();
const user = { id: 1, user_id: 31, username: "reader", bio: "Bio" };

function offsetPagination<T>(
  results: T[],
  page = 1,
  pageSize = 24
): OffsetPaginatedResponse<T> {
  return {
    count: results.length,
    next: null,
    previous: null,
    results,
    page,
    pageSize,
    totalPages: results.length > 0 ? 1 : 0,
    hasNext: false,
    hasPrevious: page > 1,
  };
}

function exploreState(
  overrides: Partial<ReturnType<typeof useExploreCatalog>> = {}
): ReturnType<typeof useExploreCatalog> {
  const books = overrides.books ?? [];
  const state: ReturnType<typeof useExploreCatalog> = {
    books: [],
    booksPagination: offsetPagination(books),
    categories: [],
    popularBooks: [],
    recommendations: [],
    isBooksLoading: false,
    isBooksFetching: false,
    isBooksError: false,
    isBooksPlaceholderData: false,
    isCategoriesLoading: false,
    isCategoriesFetching: false,
    isCategoriesError: false,
    isPopularBooksLoading: false,
    isPopularBooksFetching: false,
    isPopularBooksError: false,
    isRecommendationsLoading: false,
    isRecommendationsFetching: false,
    isRecommendationsError: false,
    refetchBooks: refetch,
    refetchCategories: refetch,
    refetchPopularBooks: refetch,
    refetchRecommendations: refetch,
  };

  return { ...state, ...overrides };
}

function searchState(
  overrides: Partial<ReturnType<typeof useSearchBooks>> = {}
): ReturnType<typeof useSearchBooks> {
  const books = overrides.books ?? [];
  const state: ReturnType<typeof useSearchBooks> = {
    books,
    pagination: offsetPagination(books),
    isLoading: false,
    isFetching: false,
    isError: false,
    isPlaceholderData: false,
    hasData: books.length > 0,
    refetch,
  };

  return { ...state, ...overrides };
}

function collectionsState(
  overrides: Partial<ReturnType<typeof useCollections>> = {}
): ReturnType<typeof useCollections> {
  const state: ReturnType<typeof useCollections> = {
    collections: [],
    isLoading: false,
    isFetching: false,
    isError: false,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    refetch,
    createCollection: vi.fn(),
    updateCollection: vi.fn(),
    deleteCollection: vi.fn(),
  };

  return { ...state, ...overrides };
}

function collectionDetailState(
  overrides: Partial<ReturnType<typeof useCollectionDetail>> = {}
): ReturnType<typeof useCollectionDetail> {
  const state: ReturnType<typeof useCollectionDetail> = {
    collection: undefined,
    isLoading: false,
    isFetching: false,
    isError: false,
    isRemovingBook: false,
    refetch,
    removeBook: vi.fn(),
  };

  return { ...state, ...overrides };
}

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
      isMarkingAsRead: false,
      isSubmittingReview: false,
      isDeletingRating: false,
      addBookToList: vi.fn(),
      markAsRead: vi.fn(),
      deleteRating: vi.fn(),
      submitRating: vi.fn(),
      submitReview: vi.fn(),
    });
    vi.mocked(useCollections).mockReturnValue(collectionsState());
    vi.mocked(useCollectionDetail).mockReturnValue(collectionDetailState());
    vi.mocked(useRelatedBooks).mockReturnValue({
      books: [],
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch,
    });
    vi.mocked(useProfileActions).mockReturnValue({
      isDeletingBook: false,
      isDeletingReview: false,
      deleteBookFromShelf: vi.fn(),
      deleteProfileReview: vi.fn(),
    });
  });

  it("renders Explore loading, error, and success states", () => {
    vi.mocked(useExploreCatalog).mockReturnValue(
      exploreState({
        isBooksLoading: true,
      })
    );
    renderPage(<Explore />);
    expect(screen.getByText("Explore")).toBeTruthy();

    vi.mocked(useExploreCatalog).mockReturnValue(
      exploreState({
        isBooksError: true,
      })
    );
    renderPage(<Explore />);
    expect(screen.getByText("Books could not be loaded")).toBeTruthy();

    vi.mocked(useExploreCatalog).mockReturnValue(
      exploreState({
        books: [{ isbn13: "1", title: "Catalog Book" }],
      })
    );
    renderPage(<Explore />);
    expect(screen.getByText("Catalog Book")).toBeTruthy();
  });

  it("renders Search loading, error, and success states", () => {
    vi.mocked(useSearchBooks).mockReturnValue({
      ...searchState(),
      isLoading: true,
      isFetching: true,
      hasData: false,
    });
    renderPage(<Search />);
    expect(screen.getByText("Search Books")).toBeTruthy();

    vi.mocked(useSearchBooks).mockReturnValue({
      ...searchState(),
      isError: true,
      hasData: false,
    });
    renderPage(<Search />);
    expect(screen.getByText("Search is unavailable")).toBeTruthy();

    vi.mocked(useSearchBooks).mockReturnValue({
      ...searchState({
        books: [{ isbn13: "2", title: "Search Book" }],
        hasData: true,
      }),
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
      collections: [
        { list_id: 3, name: "Completed", type: "done" },
        { list_id: 1, name: "To Do", type: "todo" },
      ],
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
    expect(useBookActions).toHaveBeenLastCalledWith(
      expect.objectContaining({
        completedListId: 3,
      })
    );
  });

  it("renders collection management pages", () => {
    vi.mocked(useCollections).mockReturnValue(collectionsState({ isLoading: true }));
    renderPage(<CollectionsPage />);
    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);

    vi.mocked(useCollections).mockReturnValue(collectionsState({ isError: true }));
    renderPage(<CollectionsPage />);
    expect(screen.getByText("Collections could not be loaded")).toBeTruthy();

    vi.mocked(useCollections).mockReturnValue(
      collectionsState({
        collections: [{ list_id: 1, name: "Weekend reads", book_count: 2 }],
      })
    );
    renderPage(<CollectionsPage />);
    expect(screen.getByText("Weekend reads")).toBeTruthy();

    vi.mocked(useCollectionDetail).mockReturnValue(
      collectionDetailState({
        collection: {
          list_id: 1,
          name: "Weekend reads",
          books: [{ isbn13: "1", title: "Collection Book" }],
        },
      })
    );
    renderPage(<CollectionDetailPage />);
    expect(screen.getByText("Collection Book")).toBeTruthy();
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
      isMarkingAllAsRead: false,
      markAllAsRead: vi.fn(),
      refetch,
    });
    renderPage(<Notifications />);
    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);

    vi.mocked(useNotifications).mockReturnValue({
      notifications: [],
      isLoading: false,
      isFetching: false,
      isError: true,
      isMarkingAllAsRead: false,
      markAllAsRead: vi.fn(),
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
      isMarkingAllAsRead: false,
      markAllAsRead: vi.fn(),
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
