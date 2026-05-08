from rest_framework import generics
from rest_framework.permissions import IsAdminUser, IsAuthenticatedOrReadOnly
from rest_framework.response import Response

from apps.books.serializers import BookSerializer
from apps.search import selectors, services
from apps.search.models import SearchAutocompleteTerm, SearchIndexStatus, SearchQueryLog, SearchThrottleBucket
from apps.search.serializers import (
    BookSearchResponseSerializer,
    SearchAutocompleteTermSerializer,
    SearchIndexStatusSerializer,
    SearchQueryLogSerializer,
    SearchThrottleBucketSerializer,
)


class BookSearchAPIView(generics.GenericAPIView):
    serializer_class = BookSearchResponseSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        query = request.query_params.get("q", "")
        queryset = services.search_books(query=query, user=request.user)
        serializer = BookSerializer(queryset[:50], many=True)
        return Response({"query": query, "results": serializer.data})


class SearchAutocompleteAPIView(generics.ListAPIView):
    serializer_class = SearchAutocompleteTermSerializer

    def get_queryset(self):
        return selectors.autocomplete_terms(
            prefix=self.request.query_params.get("q", ""),
            term_type=self.request.query_params.get("type"),
        )[:20]


class SearchAutocompleteTermCollectionAPIView(generics.ListCreateAPIView):
    queryset = SearchAutocompleteTerm.objects.all()
    serializer_class = SearchAutocompleteTermSerializer
    permission_classes = [IsAdminUser]


class SearchAutocompleteTermResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SearchAutocompleteTerm.objects.all()
    serializer_class = SearchAutocompleteTermSerializer
    permission_classes = [IsAdminUser]


class SearchIndexStatusListAPIView(generics.ListAPIView):
    serializer_class = SearchIndexStatusSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return selectors.index_statuses()


class SearchIndexStatusResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SearchIndexStatus.objects.select_related("current_task", "last_indexed_book")
    serializer_class = SearchIndexStatusSerializer
    permission_classes = [IsAdminUser]


class SearchQueryLogListAPIView(generics.ListAPIView):
    queryset = SearchQueryLog.objects.select_related("user")
    serializer_class = SearchQueryLogSerializer
    permission_classes = [IsAdminUser]


class SearchQueryLogResourceAPIView(generics.RetrieveDestroyAPIView):
    queryset = SearchQueryLog.objects.select_related("user")
    serializer_class = SearchQueryLogSerializer
    permission_classes = [IsAdminUser]


class SearchThrottleBucketCollectionAPIView(generics.ListCreateAPIView):
    queryset = SearchThrottleBucket.objects.all()
    serializer_class = SearchThrottleBucketSerializer
    permission_classes = [IsAdminUser]


class SearchThrottleBucketResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SearchThrottleBucket.objects.all()
    serializer_class = SearchThrottleBucketSerializer
    permission_classes = [IsAdminUser]
