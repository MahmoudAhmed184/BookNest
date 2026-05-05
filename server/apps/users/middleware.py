from django.http import JsonResponse
from django.urls import resolve


class ProfileRequiredMiddleware:
    """
    Middleware to ensure user has a profile before accessing protected endpoints
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip middleware for certain paths
        if self.should_skip_middleware(request):
            return self.get_response(request)

        # Check if user is authenticated and doesn't have profile
        if (
            request.user.is_authenticated
            and not hasattr(request.user, "profile")
            and not self.is_profile_creation_request(request)
        ):
            return JsonResponse(
                {
                    "success": False,
                    "message": "Profile required",
                    "errors": {"detail": "You must create a profile before accessing this feature"},
                    "meta": {"action_required": "create_profile", "profile_creation_url": "/api/v1/profiles/"},
                },
                status=403,
            )

        return self.get_response(request)

    def should_skip_middleware(self, request):
        """Determine if middleware should be skipped for this request"""
        # Skip for unauthenticated requests
        if not request.user.is_authenticated:
            return True

        # Get the current URL pattern
        try:
            url_name = resolve(request.path_info).url_name
        except Exception:
            return True

        # Allow these paths without profile check
        allowed_patterns = [
            "rest_password_reset",
            "rest_password_reset_confirm",
            "rest_user_details",
            "rest_logout",
            "token_verify",
            "token_refresh",
            "admin",
        ]

        # Allow profile-related endpoints
        profile_paths = [
            "/api/v1/profiles/",
            "/api/v1/profiles/me/",
            "/api/v1/profiles/me/picture/",
            "/api/v1/users/",
            "/api/v1/auth/sessions/",
        ]

        # Check URL patterns
        if url_name in allowed_patterns:
            return True

        # Check specific paths
        if any(request.path_info.startswith(path) for path in profile_paths):
            return True

        # Skip for admin and auth endpoints
        return (
            request.path_info.startswith("/admin/")
            or request.path_info.startswith("/api/v1/auth/")
            or request.path_info.startswith("/api/v1/schema/")
        )

    def is_profile_creation_request(self, request):
        """Check if this is a profile creation request"""
        return request.path_info == "/api/v1/profiles/" and request.method == "POST"
