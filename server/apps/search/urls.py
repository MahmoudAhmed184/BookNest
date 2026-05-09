from django.urls import path

from apps.search import views

urlpatterns = [
    path("search/books/", views.BookSearchAPIView.as_view(), name="book-search"),
    path("search/suggestions/", views.BookSuggestionAPIView.as_view(), name="book-suggestions"),
    path("search/related-books/", views.RelatedBookSuggestionAPIView.as_view(), name="related-book-suggestions"),
    path("search/autocomplete/", views.SearchAutocompleteAPIView.as_view(), name="search-autocomplete"),
    path(
        "search/autocomplete-terms/",
        views.SearchAutocompleteTermCollectionAPIView.as_view(),
        name="search-autocomplete-term-collection",
    ),
    path(
        "search/autocomplete-terms/<int:pk>/",
        views.SearchAutocompleteTermResourceAPIView.as_view(),
        name="search-autocomplete-term-resource",
    ),
    path("search/index-statuses/", views.SearchIndexStatusListAPIView.as_view(), name="search-index-statuses"),
    path(
        "search/index-statuses/<int:pk>/",
        views.SearchIndexStatusResourceAPIView.as_view(),
        name="search-index-status",
    ),
    path("search/query-logs/", views.SearchQueryLogListAPIView.as_view(), name="search-query-logs"),
    path("search/query-logs/<int:pk>/", views.SearchQueryLogResourceAPIView.as_view(), name="search-query-log"),
]
