from __future__ import annotations

from typing import Any

from drf_spectacular.extensions import OpenApiAuthenticationExtension
from drf_spectacular.plumbing import build_bearer_security_scheme_object
from rest_framework_simplejwt.settings import api_settings


class JWTCookieAuthenticationHeaderOnlyScheme(OpenApiAuthenticationExtension):
    target_class = "dj_rest_auth.jwt_auth.JWTCookieAuthentication"
    name = "jwtHeaderAuth"
    priority = 1

    def get_security_definition(self, auto_schema: Any) -> dict[str, Any]:
        return build_bearer_security_scheme_object(
            header_name=getattr(api_settings, "AUTH_HEADER_NAME", "HTTP_AUTHORIZATION"),
            token_prefix=api_settings.AUTH_HEADER_TYPES[0],
            bearer_format="JWT",
        )
