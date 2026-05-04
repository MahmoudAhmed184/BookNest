from django.urls import path

from apps.books.views.reading_list import (
    AdminUserReadingListsAPIView,
    ReadingListBookMembershipAPIView,
    ReadingListCollectionAPIView,
    ReadingListResourceAPIView,
)
from apps.books.views.review import (
    BookRatingCollectionAPIView,
    BookRatingResourceAPIView,
    BookRatingsByBookAPIView,
    BookReviewCollectionAPIView,
    BookReviewResourceAPIView,
    BookReviewsByBookAPIView,
    UserBookRatingAPIView,
    UserRatingsAPIView,
    UserReviewsAPIView,
)
from apps.books.views.search import BookSearchAPIView
from apps.books.views.suggestion import BookSuggestionAPIView
from apps.books.views.catalog import (
    AuthorBookListAPIView,
    AuthorDetailAPIView,
    AuthorListAPIView,
    BookCollectionAPIView,
    BookResourceAPIView,
    FeedActivityListAPIView,
    GenreBookListAPIView,
    GenreListAPIView,
    RelatedBookListAPIView,
)


urlpatterns = [
    path("books/", BookCollectionAPIView.as_view(), name="book-collection"),
    path("books/search-results/", BookSearchAPIView.as_view(), name="book-search-results"),
    path("books/suggestions/", BookSuggestionAPIView.as_view(), name="book-suggestions"),
    path("books/<str:pk>/", BookResourceAPIView.as_view(), name="book-resource"),
    path("books/<str:book_id>/related-books/", RelatedBookListAPIView.as_view(), name="related-book-list"),
    path("books/<str:book_id>/reviews/", BookReviewsByBookAPIView.as_view(), name="book-reviews"),
    path("books/<str:book_id>/ratings/", BookRatingsByBookAPIView.as_view(), name="book-ratings"),
    path("books/<str:book_id>/ratings/me/", UserBookRatingAPIView.as_view(), name="user-book-rating"),
    path("authors/", AuthorListAPIView.as_view(), name="author-list"),
    path("authors/<str:pk>/", AuthorDetailAPIView.as_view(), name="author-detail"),
    path("authors/<int:pk>/books/", AuthorBookListAPIView.as_view(), name="author-books"),
    path("genres/", GenreListAPIView.as_view(), name="genre-list"),
    path("genres/<int:pk>/books/", GenreBookListAPIView.as_view(), name="genre-books"),
    path("feed-activities/", FeedActivityListAPIView.as_view(), name="feed-activity-list"),
    path("reviews/", BookReviewCollectionAPIView.as_view(), name="review-collection"),
    path("reviews/<str:review_id>/", BookReviewResourceAPIView.as_view(), name="review-resource"),
    path("ratings/", BookRatingCollectionAPIView.as_view(), name="rating-collection"),
    path("ratings/<str:rate_id>/", BookRatingResourceAPIView.as_view(), name="rating-resource"),
    path("reading-lists/", ReadingListCollectionAPIView.as_view(), name="reading-list-collection"),
    path("reading-lists/<int:list_id>/", ReadingListResourceAPIView.as_view(), name="reading-list-resource"),
    path(
        "reading-lists/<int:list_id>/books/<str:book_id>/",
        ReadingListBookMembershipAPIView.as_view(),
        name="reading-list-book-membership",
    ),
    path("users/<int:user_id>/ratings/", UserRatingsAPIView.as_view(), name="user-ratings"),
    path("users/<int:user_id>/reviews/", UserReviewsAPIView.as_view(), name="user-reviews"),
    path("users/<int:user_id>/reading-lists/", AdminUserReadingListsAPIView.as_view(), name="user-reading-lists"),
]
