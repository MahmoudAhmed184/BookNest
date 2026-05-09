from django.db.models import Q
from rest_framework import generics, serializers, status
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAdminUser, IsAuthenticatedOrReadOnly
from rest_framework.response import Response

from apps.books.models import Book
from apps.books.serializers import BookSerializer
from apps.common.pagination import StandardResultsSetPagination
from apps.search import selectors, services
from apps.search.models import SearchAutocompleteTerm, SearchIndexStatus, SearchQueryLog
from apps.search.serializers import (
    BookSearchResponseSerializer,
    SearchAutocompleteTermSerializer,
    SearchIndexStatusSerializer,
    SearchQueryLogSerializer,
)


class BookSearchQuerySerializer(serializers.Serializer):
    q = serializers.CharField(required=False, allow_blank=True, default="")
    genres = serializers.CharField(required=False, allow_blank=True)
    genre_ids = serializers.CharField(required=False, allow_blank=True)
    authors = serializers.CharField(required=False, allow_blank=True)
    author_ids = serializers.CharField(required=False, allow_blank=True)
    languages = serializers.CharField(required=False, allow_blank=True)
    sources = serializers.CharField(required=False, allow_blank=True)
    min_rating = serializers.FloatField(required=False, min_value=0, max_value=5)
    max_rating = serializers.FloatField(required=False, min_value=0, max_value=5)
    pub_date_from = serializers.DateField(required=False)
    pub_date_to = serializers.DateField(required=False)
    publication_year_from = serializers.IntegerField(required=False, min_value=0)
    publication_year_to = serializers.IntegerField(required=False, min_value=0)
    page_count_min = serializers.IntegerField(required=False, min_value=1)
    page_count_max = serializers.IntegerField(required=False, min_value=1)
    num_pages = serializers.IntegerField(required=False, min_value=1)
    include_adult = serializers.BooleanField(required=False, default=False)
    include_external = serializers.BooleanField(required=False, default=False)
    ordering = serializers.ChoiceField(
        choices=["relevance", "trending", "popular", "rating", "newest", "title"],
        required=False,
        default="relevance",
    )

    def validate_q(self, value: str) -> str:
        value = value.strip()
        if value and len(value) < 2:
            raise serializers.ValidationError("Search query must be at least 2 characters long.")
        return value

    def validate(self, attrs):
        if (
            attrs.get("min_rating") is not None
            and attrs.get("max_rating") is not None
            and attrs["max_rating"] < attrs["min_rating"]
        ):
            raise serializers.ValidationError(
                {"max_rating": "Maximum rating must be greater than minimum rating."}
            )
        if attrs.get("pub_date_from") and attrs.get("pub_date_to") and attrs["pub_date_to"] < attrs["pub_date_from"]:
            raise serializers.ValidationError({"pub_date_to": "End date must be after start date."})
        if (
            attrs.get("publication_year_from")
            and attrs.get("publication_year_to")
            and attrs["publication_year_to"] < attrs["publication_year_from"]
        ):
            raise serializers.ValidationError({"publication_year_to": "End year must be greater than start year."})
        if (
            attrs.get("page_count_min")
            and attrs.get("page_count_max")
            and attrs["page_count_max"] < attrs["page_count_min"]
        ):
            raise serializers.ValidationError(
                {"page_count_max": "Maximum page count must be greater than minimum page count."}
            )
        return attrs


class SearchSuggestionQuerySerializer(serializers.Serializer):
    q = serializers.CharField(min_length=1)
    limit = serializers.IntegerField(required=False, min_value=1, max_value=50, default=10)
    type = serializers.ChoiceField(
        choices=[choice[0] for choice in SearchAutocompleteTerm.TermType.choices],
        required=False,
    )


class RelatedSuggestionQuerySerializer(serializers.Serializer):
    book_id = serializers.IntegerField(required=False, min_value=1)
    title = serializers.CharField(required=False, allow_blank=True)
    limit = serializers.IntegerField(required=False, min_value=1, max_value=50, default=10)
    include_external = serializers.BooleanField(required=False, default=False)

    def validate(self, attrs):
        if not attrs.get("book_id") and not attrs.get("title", "").strip():
            raise serializers.ValidationError("Either book_id or title is required.")
        return attrs


class BookSearchAPIView(generics.GenericAPIView):
    serializer_class = BookSearchResponseSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        query_serializer = BookSearchQuerySerializer(data=request.query_params)
        query_serializer.is_valid(raise_exception=True)
        values = query_serializer.validated_data
        filter_names = {
            "genres",
            "genre_ids",
            "authors",
            "author_ids",
            "languages",
            "sources",
            "min_rating",
            "max_rating",
            "pub_date_from",
            "pub_date_to",
            "publication_year_from",
            "publication_year_to",
            "page_count_min",
            "page_count_max",
            "num_pages",
            "include_adult",
        }
        filters = {
            key: value
            for key, value in values.items()
            if key in filter_names and value not in (None, "", [])
        }
        try:
            page_size = int(request.query_params.get("page_size", self.pagination_class.page_size))
        except (TypeError, ValueError):
            page_size = self.pagination_class.page_size
        page_size = max(1, min(page_size, self.pagination_class.max_page_size))
        queryset = services.search_books(
            query=values.get("q", ""),
            user=request.user,
            filters=filters,
            ordering=values.get("ordering", "relevance"),
            include_external=values.get("include_external", False),
            page_size=page_size,
        )
        page = self.paginate_queryset(queryset)
        serializer = BookSerializer(page if page is not None else queryset, many=True, context={"request": request})
        if page is not None:
            response = self.get_paginated_response(serializer.data)
            response.data["query"] = values.get("q", "")
            response.data["filters_applied"] = filters
            response.data["ordering"] = values.get("ordering", "relevance")
            response.data["include_external"] = values.get("include_external", False)
            return response
        return Response(
            {
                "query": values.get("q", ""),
                "filters_applied": filters,
                "ordering": values.get("ordering", "relevance"),
                "include_external": values.get("include_external", False),
                "results": serializer.data,
            }
        )


class SearchAutocompleteAPIView(generics.ListAPIView):
    serializer_class = SearchAutocompleteTermSerializer

    def get_queryset(self):
        serializer = SearchSuggestionQuerySerializer(data=self.request.query_params)
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data
        return services.search_suggestions(
            query=values["q"],
            limit=values["limit"],
            term_type=values.get("type"),
        )


class BookSuggestionAPIView(generics.GenericAPIView):
    serializer_class = SearchAutocompleteTermSerializer

    def get(self, request):
        serializer = SearchSuggestionQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data
        suggestions = services.search_suggestions(
            query=values["q"],
            limit=values["limit"],
            term_type=values.get("type"),
        )
        return Response(
            {
                "query": values["q"],
                "suggestions": SearchAutocompleteTermSerializer(suggestions, many=True).data,
                "count": len(suggestions),
            },
            status=status.HTTP_200_OK,
        )


class RelatedBookSuggestionAPIView(generics.GenericAPIView):
    serializer_class = BookSerializer

    def get(self, request):
        serializer = RelatedSuggestionQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data
        if values.get("book_id"):
            reference_book = generics.get_object_or_404(Book.objects.visible(), pk=values["book_id"])
        else:
            title = values["title"].strip()
            reference_book = (
                Book.objects.visible()
                .filter(Q(title__iexact=title) | Q(title__icontains=title))
                .order_by("title", "id")
                .first()
            )
            if reference_book is None:
                raise NotFound("Book not found.")
        suggestions = list(services.related_book_suggestions(book=reference_book, limit=values["limit"]))
        external_queued = services.queue_external_enrichment_if_needed(
            query=reference_book.title,
            user=request.user,
            result_count=len(suggestions),
            include_external=values["include_external"],
            page_size=values["limit"],
        )
        return Response(
            {
                "reference_book": BookSerializer(reference_book, context={"request": request}).data,
                "suggestions": BookSerializer(suggestions, many=True, context={"request": request}).data,
                "count": len(suggestions),
                "include_external": values["include_external"],
                "external_enrichment_queued": external_queued,
            },
            status=status.HTTP_200_OK,
        )


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

