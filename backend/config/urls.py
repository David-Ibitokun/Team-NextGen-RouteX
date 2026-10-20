"""
RouteX URL Configuration
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.decorators import api_view
from rest_framework.response import Response
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)
from drf_spectacular.utils import extend_schema

@extend_schema(
    tags=["system"],
    summary="API Root & Discovery",
    description="Returns discovery links to all RouteX primary resource collections, documentation, and health check.",
)
@api_view(["GET"])
def api_root(request):
    """
    API Root endpoint providing discovery for all primary RouteX API resources,
    interactive Swagger UI documentation, and health status.
    """
    return Response({
        "name": "RouteX API",
        "tagline": "Know the Road Ahead.",
        "team": "NextGen",
        "version": "v1",
        "documentation": {
            "swagger_ui": request.build_absolute_uri("/api/docs/"),
            "redoc": request.build_absolute_uri("/api/redoc/"),
            "openapi_schema": request.build_absolute_uri("/api/schema/"),
        },
        "endpoints": {
            "hazards": request.build_absolute_uri("/api/v1/hazards/"),
            "auth": request.build_absolute_uri("/api/v1/auth/"),
            "moderation": request.build_absolute_uri("/api/v1/moderation/"),
            "admin": request.build_absolute_uri("/api/v1/admin/"),
            "ai": request.build_absolute_uri("/api/v1/ai/"),
            "notifications": request.build_absolute_uri("/api/v1/notifications/"),
            "health": request.build_absolute_uri("/api/v1/health/"),
        }
    })

@extend_schema(
    tags=["system"],
    summary="Service Health Check",
    description="Returns operational uptime health and backend deployment edition status.",
)
@api_view(["GET"])
def health_check(request):
    """
    Health check endpoint returning system status and backend service version.
    """
    return Response({
        "status": "healthy",
        "service": "routex-backend",
        "version": "1.0.0",
        "edition": "Community Edition",
    })

urlpatterns = [
    path("admin/", admin.site.urls),
    
    # OpenAPI Schema & Interactive Documentation
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    
    # Versioned v1 Aliases for Swagger & ReDoc
    path("api/v1/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui-v1"),
    path("api/v1/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc-v1"),

    # API Endpoints
    path("api/v1/", api_root, name="api-root"),
    path("api/v1/health/", health_check, name="health-check"),
    path("api/v1/hazards/", include("apps.hazards.urls")),
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/moderation/", include("apps.moderation.urls")),
    path("api/v1/admin/", include("apps.accounts.urls_admin")),
    path("api/v1/ai/", include("apps.ai_assistant.urls")),
    path("api/v1/notifications/", include("apps.notifications.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
