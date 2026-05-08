import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import BookPage from "../features/catalog/pages/BookPage";
import CollectionDetailPage from "../features/collections/pages/CollectionDetailPage";
import CollectionsPage from "../features/collections/pages/CollectionsPage";
import AuthorsPage from "../features/catalog/pages/AuthorsPage";
import Explore from "../features/catalog/pages/ExplorePage";
import GenreBooksPage from "../features/catalog/pages/GenreBooksPage";
import Search from "../features/catalog/pages/SearchPage";
import Notifications from "../features/notifications/pages/NotificationsPage";
import Profile from "../features/profile/pages/ProfilePage";
import Settings from "../features/settings/pages/SettingsPage";
import UserProfile from "../features/profile/pages/UserProfilePage";
import ProfileConnections from "../features/follows/pages/ProfileConnectionsPage";
import { useBookActions } from "../features/catalog/hooks/useBookActions";
import { useBookPageData } from "../features/catalog/hooks/useBookPageData";
import { useAuthors } from "../features/catalog/hooks/useAuthors";
import { useExploreCatalog } from "../features/catalog/hooks/useExploreCatalog";
import { useGenreBooks } from "../features/catalog/hooks/useGenreBooks";
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
import {
  useFollowMutations,
  useFollows,
  useFollowStatus,
  useProfileFollowers,
  useProfileFollowing,
} from "../features/follows/hooks/followHooks";
import { AuthContext } from "../features/auth/store/authContext";
import type { OffsetPaginatedResponse } from "../types/api";
import type {
  Author,
  Book,
} from "../features/catalog/types/book";
import type {
  CollectionBook,
  ReadingCollection,
} from "../features/collections/types/collection";
import type { FollowRelationship } from "../features/follows/types/follow";
import type { Notification } from "../features/notifications/types/notification";
import type {
  Profile as UserProfileType,
  UserPreference,
} from "../features/profile/types/user";

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
vi.mock("../features/catalog/hooks/useAuthors", () => ({
  useAuthors: vi.fn(),
}));
vi.mock("../features/catalog/hooks/useGenreBooks", () => ({
  useGenreBooks: vi.fn(),
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
  toProfileInterestSelection: vi.fn((interest) => ({
    id: interest.id,
    genre: interest.genre,
    genre_name: interest.genre_name ?? String(interest.genre),
    weight: interest.weight,
  })),
  useSettingsProfile: vi.fn(),
}));
vi.mock("../features/notifications/hooks/useNotifications", () => ({
  useNotifications: vi.fn(),
}));
vi.mock("../features/follows/hooks/followHooks", () => ({
  useFollowMutations: vi.fn(),
  useFollows: vi.fn(),
  useFollowStatus: vi.fn(),
  useProfileFollowers: vi.fn(),
  useProfileFollowing: vi.fn(),
}));

function renderPage(page: ReactElement): void {
  cleanup();
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  render(
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}

const refetch = vi.fn();
const user: UserProfileType = {
  id: 1,
  user: {
    id: 31,
    email: "reader@example.com",
    display_name: "reader",
  },
  handle: "reader",
  bio: "Bio",
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

function book(id: number, title: string): Book {
  return { id, title };
}

function author(id: number, name: string): Author {
  return { id, name, books_count: 4 };
}

function collection(id: number, name: string): ReadingCollection {
  return {
    id,
    owner: 31,
    name,
    list_type: "custom",
    privacy: "private",
    item_count: 2,
  };
}

function collectionItem(id: number, itemBook: Book): CollectionBook {
  return {
    id,
    collection: 1,
    book: itemBook.id,
    book_detail: itemBook,
    status: "todo",
    position: id,
  };
}

function follow(id: number, displayName: string): FollowRelationship {
  return {
    id,
    follower: 32,
    following: 31,
    follower_detail: {
      id: 32,
      email: "follower@example.com",
      display_name: displayName,
    },
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
    isRefreshingRecommendations: false,
    refetchBooks: refetch,
    refetchCategories: refetch,
    refetchPopularBooks: refetch,
    refetchRecommendations: refetch,
    refreshRecommendations: vi.fn(),
    dismissRecommendation: vi.fn(),
    clickRecommendation: vi.fn(),
    submitRecommendationFeedback: vi.fn(),
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
    error: null,
    isPlaceholderData: false,
    hasData: books.length > 0,
    refetch,
  };

  return { ...state, ...overrides };
}

function authorsState(
  overrides: Partial<ReturnType<typeof useAuthors>> = {}
): ReturnType<typeof useAuthors> {
  const authors = overrides.authors ?? [];
  const state: ReturnType<typeof useAuthors> = {
    authors,
    pagination: offsetPagination(authors),
    isLoading: false,
    isFetching: false,
    isError: false,
    isPlaceholderData: false,
    refetch,
  };

  return { ...state, ...overrides };
}

function genreBooksState(
  overrides: Partial<ReturnType<typeof useGenreBooks>> = {}
): ReturnType<typeof useGenreBooks> {
  const books = overrides.books ?? [];
  const state: ReturnType<typeof useGenreBooks> = {
    books,
    pagination: offsetPagination(books),
    isLoading: false,
    isFetching: false,
    isError: false,
    isPlaceholderData: false,
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

function followRowsState(
  overrides: Partial<ReturnType<typeof useProfileFollowers>> = {}
): ReturnType<typeof useProfileFollowers> {
  const state = {
    data: offsetPagination<FollowRelationship>([]),
    isLoading: false,
    isFetching: false,
    isError: false,
    refetch,
  };

  return { ...state, ...overrides } as ReturnType<typeof useProfileFollowers>;
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
      isUpdatingReview: false,
      isVotingReview: false,
      addBookToList: vi.fn(),
      markAsRead: vi.fn(),
      deleteRating: vi.fn(),
      editReview: vi.fn(),
      voteReview: vi.fn(),
      deleteReviewVote: vi.fn(),
      submitRating: vi.fn(),
      submitReview: vi.fn(),
    });
    vi.mocked(useCollections).mockReturnValue(collectionsState());
    vi.mocked(useCollectionDetail).mockReturnValue(collectionDetailState());
    vi.mocked(useAuthors).mockReturnValue(authorsState());
    vi.mocked(useGenreBooks).mockReturnValue(genreBooksState());
    vi.mocked(useRelatedBooks).mockReturnValue({
      relatedBooks: [],
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
    vi.mocked(useFollows).mockReturnValue(
      {
        data: [],
        isLoading: false,
        isFetching: false,
        isError: false,
        refetch,
      } as unknown as ReturnType<typeof useFollows>
    );
    vi.mocked(useProfileFollowers).mockReturnValue(followRowsState());
    vi.mocked(useProfileFollowing).mockReturnValue(followRowsState());
    vi.mocked(useFollowMutations).mockReturnValue({
      followUser: vi.fn(),
      unfollowById: vi.fn(),
      isFollowing: false,
      isUnfollowing: false,
    });
    vi.mocked(useFollowStatus).mockReturnValue({
      data: null,
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch,
    } as unknown as ReturnType<typeof useFollowStatus>);
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
        books: [book(1, "Catalog Book")],
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
        books: [book(2, "Search Book")],
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
      isReviewVotesError: false,
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
      isReviewVotesError: false,
      refetchBook: refetch,
      refetchReviews: refetch,
      refetchRatings: refetch,
    });
    renderPage(<BookPage />);
    expect(screen.getByText("Book details are unavailable")).toBeTruthy();

    vi.mocked(useBookPageData).mockReturnValue({
      book: book(1, "Book Detail"),
      collections: [
        { ...collection(3, "Completed"), list_type: "done" },
        { ...collection(1, "To Do"), list_type: "todo" },
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
      isReviewVotesError: false,
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
        collections: [collection(1, "Weekend reads")],
      })
    );
    renderPage(<CollectionsPage />);
    expect(screen.getByText("Weekend reads")).toBeTruthy();

    vi.mocked(useCollectionDetail).mockReturnValue(
      collectionDetailState({
        collection: {
          id: 1,
          owner: 31,
          name: "Weekend reads",
          list_type: "custom",
          privacy: "private",
          items: [collectionItem(1, book(1, "Collection Book"))],
        },
      })
    );
    renderPage(<CollectionDetailPage />);
    expect(screen.getByText("Collection Book")).toBeTruthy();
  });

  it("renders author browse and genre books pages", () => {
    vi.mocked(useAuthors).mockReturnValue(
      authorsState({
        authors: [author(7, "Octavia Butler")],
      })
    );
    renderPage(<AuthorsPage />);
    expect(screen.getByText("Octavia Butler")).toBeTruthy();

    vi.mocked(useGenreBooks).mockReturnValue(
      genreBooksState({
        books: [book(42, "Genre Book")],
      })
    );
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
        <MemoryRouter initialEntries={["/genres/1/books?name=Fiction"]}>
          <GenreBooksPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );
    expect(screen.getByText("Fiction")).toBeTruthy();
    expect(screen.getByText("Genre Book")).toBeTruthy();
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

  it("renders profile connection lists", () => {
    vi.mocked(useProfileFollowers).mockReturnValue(
      followRowsState({
        data: offsetPagination([follow(1, "follower")]),
      })
    );

    cleanup();
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider
          value={{
            user: true,
            token: "token",
            userLogin: vi.fn(),
            logout: vi.fn(),
          }}
        >
          <MemoryRouter initialEntries={["/profile/1/followers"]}>
            <ProfileConnections />
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    );

    expect(screen.getByText("Followers")).toBeTruthy();
    expect(screen.getByText("follower")).toBeTruthy();
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
      notificationTypes: [],
      isLoading: true,
      isFetching: false,
      isError: false,
      isTypesLoading: false,
      isTypesError: false,
      isMarkingAllAsRead: false,
      isUpdatingNotification: false,
      isDeletingNotification: false,
      markAllAsRead: vi.fn(),
      markRead: vi.fn(),
      markUnread: vi.fn(),
      deleteNotification: vi.fn(),
      refetch,
    });
    renderPage(<Notifications />);
    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);

    vi.mocked(useNotifications).mockReturnValue({
      notifications: [],
      notificationTypes: [],
      isLoading: false,
      isFetching: false,
      isError: true,
      isTypesLoading: false,
      isTypesError: false,
      isMarkingAllAsRead: false,
      isUpdatingNotification: false,
      isDeletingNotification: false,
      markAllAsRead: vi.fn(),
      markRead: vi.fn(),
      markUnread: vi.fn(),
      deleteNotification: vi.fn(),
      refetch,
    });
    renderPage(<Notifications />);
    expect(screen.getByText("Notifications could not be loaded")).toBeTruthy();

    vi.mocked(useNotifications).mockReturnValue({
      notifications: [
        notification(1, "New follower"),
      ],
      notificationTypes: ["social"],
      isLoading: false,
      isFetching: false,
      isError: false,
      isTypesLoading: false,
      isTypesError: false,
      isMarkingAllAsRead: false,
      isUpdatingNotification: false,
      isDeletingNotification: false,
      markAllAsRead: vi.fn(),
      markRead: vi.fn(),
      markUnread: vi.fn(),
      deleteNotification: vi.fn(),
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
    preferences,
    isLoading: false,
    isFetching: false,
    isError: false,
    isSavingProfile: false,
    isSavingPreferences: false,
    isUploadingPicture: false,
    refetch,
    updateProfile: vi.fn(),
    updatePreferences: vi.fn(),
    uploadProfilePicture: vi.fn(),
    ...overrides,
  };
}
