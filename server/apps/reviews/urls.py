from django.urls import path

from apps.reviews import views

urlpatterns = [
    path("ratings/", views.RatingCollectionAPIView.as_view(), name="rating-collection"),
    path("ratings/<int:pk>/", views.RatingResourceAPIView.as_view(), name="rating-resource"),
    path("reviews/", views.ReviewCollectionAPIView.as_view(), name="review-collection"),
    path("reviews/<int:pk>/", views.ReviewResourceAPIView.as_view(), name="review-resource"),
    path("review-votes/", views.ReviewVoteCollectionAPIView.as_view(), name="review-vote-collection"),
    path("review-votes/<int:pk>/", views.ReviewVoteResourceAPIView.as_view(), name="review-vote-resource"),
    path("reviews/<int:review_id>/votes/", views.ReviewVoteAPIView.as_view(), name="review-vote"),
    path("books/<int:book_id>/ratings/", views.RatingCollectionAPIView.as_view(), name="book-rating-collection"),
    path("books/<int:book_id>/reviews/", views.ReviewCollectionAPIView.as_view(), name="book-review-collection"),
]
