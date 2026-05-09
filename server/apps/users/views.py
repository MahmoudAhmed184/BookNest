from rest_framework import generics, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import (
    SAFE_METHODS,
    BasePermission,
    IsAdminUser,
    IsAuthenticated,
    IsAuthenticatedOrReadOnly,
)
from rest_framework.response import Response

from apps.collections import selectors as collection_selectors
from apps.collections.serializers import ReadingCollectionSerializer
from apps.common.pagination import StandardResultsSetPagination
from apps.reviews import selectors as review_selectors
from apps.reviews.serializers import RatingSerializer, ReviewSerializer
from apps.users import selectors, services
from apps.users.models import Profile, ProfileInterest, User, UserPreference, UserSocialLink
from apps.users.serializers import (
    ProfileInterestSerializer,
    ProfileOverviewSerializer,
    ProfilePictureUploadSerializer,
    ProfileSerializer,
    UserPreferenceSerializer,
    UserSerializer,
    UserSocialLinkSerializer,
)


class IsProfileOwnerOrStaffOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj: Profile) -> bool:
        if request.method in SAFE_METHODS:
            return selectors.can_view_profile(target_user=obj.user, viewer=request.user)
        return bool(
            request.user
            and request.user.is_authenticated
            and (obj.user_id == request.user.id or request.user.is_staff or request.user.is_superuser)
        )


class UserCollectionAPIView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return selectors.user_queryset()


class UserResourceAPIView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]


class CurrentUserAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ProfileCollectionAPIView(generics.ListCreateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return selectors.visible_profiles_for_viewer(viewer=self.request.user)

    def perform_create(self, serializer):
        serializer.instance = services.create_profile(user=self.request.user, validated_data=serializer.validated_data)


class ProfileResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [IsProfileOwnerOrStaffOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return selectors.profile_queryset()


class CurrentProfileAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        return selectors.get_profile_for_user(user=self.request.user)


class CurrentProfilePictureAPIView(generics.GenericAPIView):
    serializer_class = ProfilePictureUploadSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        profile = selectors.get_profile_for_user(user=request.user)
        image_file = request.FILES.get("picture")
        if image_file is None:
            return Response({"picture": "No image file provided."}, status=status.HTTP_400_BAD_REQUEST)

        error = services.validate_profile_image(image_file=image_file)
        if error:
            return Response({"picture": error}, status=status.HTTP_400_BAD_REQUEST)

        upload_result = services.upload_profile_picture(profile=profile, image_file=image_file)
        return Response({"picture": str(profile.picture), "cloudinary": upload_result})


class CurrentPreferenceAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = UserPreferenceSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return selectors.preference_for_user(user=self.request.user)


class UserPreferenceCollectionAPIView(generics.ListAPIView):
    queryset = UserPreference.objects.select_related("user")
    serializer_class = UserPreferenceSerializer
    permission_classes = [IsAdminUser]


class UserPreferenceResourceAPIView(generics.RetrieveUpdateAPIView):
    queryset = UserPreference.objects.select_related("user")
    serializer_class = UserPreferenceSerializer
    permission_classes = [IsAdminUser]


class ProfileInterestCollectionAPIView(generics.ListCreateAPIView):
    serializer_class = ProfileInterestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        profile = selectors.get_profile_for_user(user=self.request.user)
        return ProfileInterest.objects.select_related("profile", "genre").filter(profile=profile)

    def perform_create(self, serializer):
        profile = selectors.get_profile_for_user(user=self.request.user)
        serializer.instance, _created = ProfileInterest.objects.update_or_create(
            profile=profile,
            genre=serializer.validated_data["genre"],
            defaults={"weight": serializer.validated_data.get("weight", 1)},
        )


class ProfileInterestResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProfileInterestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        profile = selectors.get_profile_for_user(user=self.request.user)
        return ProfileInterest.objects.select_related("profile", "genre").filter(profile=profile)


class UserSocialLinkCollectionAPIView(generics.ListCreateAPIView):
    serializer_class = UserSocialLinkSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        profile = selectors.get_profile_for_user(user=self.request.user)
        return UserSocialLink.objects.select_related("profile").filter(profile=profile)

    def perform_create(self, serializer):
        profile = selectors.get_profile_for_user(user=self.request.user)
        serializer.instance, _created = UserSocialLink.objects.update_or_create(
            profile=profile,
            platform=serializer.validated_data["platform"],
            defaults={
                "url": serializer.validated_data["url"],
                "label": serializer.validated_data.get("label", ""),
            },
        )


class UserSocialLinkResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserSocialLinkSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        profile = selectors.get_profile_for_user(user=self.request.user)
        return UserSocialLink.objects.select_related("profile").filter(profile=profile)


class UserProfileAPIView(generics.RetrieveAPIView):
    queryset = Profile.objects.select_related("user")
    serializer_class = ProfileSerializer
    lookup_field = "user_id"

    def get_object(self):
        profile = super().get_object()
        selectors.ensure_can_view_profile(target_user=profile.user, viewer=self.request.user)
        return profile


class UserProfileOverviewAPIView(generics.GenericAPIView):
    serializer_class = ProfileOverviewSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request, user_id: int):
        target_user = selectors.get_user(pk=user_id)
        selectors.ensure_can_view_profile(target_user=target_user, viewer=request.user)
        profile = selectors.get_profile_for_user(user=target_user)
        reviews = review_selectors.reviews_for_target_user(target_user=target_user, viewer=request.user)
        ratings = review_selectors.visible_ratings_for_profile_overview(
            target_user=target_user,
            viewer=request.user,
        )
        collections = collection_selectors.collections_for_target_user(
            target_user=target_user,
            viewer=request.user,
        )
        overview = {
            "user": target_user,
            "profile": profile,
            "viewer_context": selectors.profile_viewer_context(target_user=target_user, viewer=request.user),
            "stats": {
                "followers_count": target_user.follower_relationships.count(),
                "following_count": target_user.following_relationships.count(),
                "reviews_count": reviews.count(),
                "ratings_count": ratings.count(),
                "collections_count": collections.count(),
                "books_read_count": profile.books_read_count,
            },
            "recent_reviews": list(reviews[:5]),
            "recent_ratings": list(ratings[:5]),
            "recent_collections": list(collections[:5]),
        }
        serializer = self.get_serializer(overview)
        return Response(serializer.data)


class UserReviewListAPIView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        target_user = selectors.get_user(pk=self.kwargs["user_id"])
        return review_selectors.reviews_for_target_user(target_user=target_user, viewer=self.request.user)


class UserRatingListAPIView(generics.ListAPIView):
    serializer_class = RatingSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        target_user = selectors.get_user(pk=self.kwargs["user_id"])
        return review_selectors.ratings_for_target_user(target_user=target_user, viewer=self.request.user)


class UserReadingCollectionListAPIView(generics.ListAPIView):
    serializer_class = ReadingCollectionSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        target_user = selectors.get_user(pk=self.kwargs["user_id"])
        return collection_selectors.collections_for_target_user(target_user=target_user, viewer=self.request.user)
