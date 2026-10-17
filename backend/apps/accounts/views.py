"""
RouteX Accounts Views
Session-based authentication: CSRF cookie, register, login, logout, me.
"""
from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from drf_spectacular.utils import extend_schema, OpenApiExample

from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserPublicSerializer,
    UserProfileUpdateSerializer,
)
from apps.hazards.serializers import HazardReportSerializer


class LoginRateThrottle(AnonRateThrottle):
    """Limit login attempts to 10 per minute per IP for anonymous users."""
    rate = "10/min"
    scope = "login"


class RegisterRateThrottle(AnonRateThrottle):
    """Limit registration to 5 per hour per IP."""
    rate = "5/hour"
    scope = "register"


@extend_schema(
    tags=["auth"],
    summary="Obtain a CSRF token",
    description=(
        "Sets a CSRF cookie required for all state-changing requests "
        "(POST, PUT, PATCH, DELETE). Call this once at app start before performing "
        "login, registration, or form submissions."
    ),
    responses={200: {"type": "object", "properties": {"csrfToken": {"type": "string"}}}},
)
@api_view(["GET"])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def csrf_token_view(request):
    """Return a CSRF token and set the cookie for subsequent mutations."""
    return Response({"csrfToken": get_token(request)})


@extend_schema(
    tags=["auth"],
    summary="Register a new user account",
    description=(
        "Create a new RouteX citizen account. Requires a unique username, "
        "valid email address, and a strong password (min 8 characters). "
        "An optional display name may be provided. The user is automatically "
        "logged in upon successful registration."
    ),
    request=UserRegistrationSerializer,
    responses={
        201: UserPublicSerializer,
        400: {"description": "Validation errors (duplicate username/email, weak password)"},
    },
    examples=[
        OpenApiExample(
            "New citizen registration",
            value={
                "username": "adetola",
                "email": "adetola@example.com",
                "password": "Str0ngPass!2024",
                "display_name": "Adetola Adeyemi",
            },
            request_only=True,
        ),
    ],
)
@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([RegisterRateThrottle])
def register_view(request):
    """Register a new user account and start a session."""
    serializer = UserRegistrationSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = serializer.save()
    login(request, user)

    user_data = UserPublicSerializer(user).data
    return Response(user_data, status=status.HTTP_201_CREATED)


@extend_schema(
    tags=["auth"],
    summary="Log in with username and password",
    description=(
        "Authenticate using username and password. A session cookie is set on success. "
        "Requires a valid CSRF token (obtain from GET /api/v1/auth/csrf/). "
        "Returns the authenticated user's public profile."
    ),
    request=UserLoginSerializer,
    responses={
        200: UserPublicSerializer,
        401: {"description": "Invalid credentials"},
        400: {"description": "Missing required fields"},
    },
    examples=[
        OpenApiExample(
            "Login request",
            value={"username": "adetola", "password": "Str0ngPass!2024"},
            request_only=True,
        ),
    ],
)
@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([LoginRateThrottle])
def login_view(request):
    """Authenticate a user and start a session."""
    serializer = UserLoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    username_or_email = serializer.validated_data["username"]
    password = serializer.validated_data["password"]

    user = authenticate(request, username=username_or_email, password=password)
    if user is None and "@" in username_or_email:
        from django.contrib.auth.models import User
        try:
            matched_user = User.objects.get(email__iexact=username_or_email)
            user = authenticate(request, username=matched_user.username, password=password)
        except (User.DoesNotExist, User.MultipleObjectsReturned):
            pass

    if user is None:
        return Response(
            {"detail": "Invalid credentials. Please check your username/email and password."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    login(request, user)
    user_data = UserPublicSerializer(user).data
    return Response(user_data, status=status.HTTP_200_OK)


@extend_schema(
    tags=["auth"],
    summary="Log out the current session",
    description="Ends the current authenticated session and clears the session cookie.",
    responses={200: {"type": "object", "properties": {"detail": {"type": "string"}}}},
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Log out the current user and invalidate the session."""
    logout(request)
    return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)


@extend_schema(
    tags=["auth"],
    summary="Get the authenticated user's profile",
    description=(
        "Returns the profile of the currently authenticated user. "
        "Returns 401 if not authenticated."
    ),
    responses={
        200: UserPublicSerializer,
        401: {"description": "Not authenticated"},
    },
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    """Return the currently authenticated user's public profile."""
    user_data = UserPublicSerializer(request.user).data
    return Response(user_data, status=status.HTTP_200_OK)


@extend_schema(
    tags=["auth"],
    summary="Get the authenticated user's hazard reports",
    description=(
        "Returns all road hazard reports submitted by the currently authenticated user, "
        "ordered by most recent first."
    ),
    responses={200: HazardReportSerializer(many=True)},
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_reports_view(request):
    """Return all hazard reports submitted by the current user."""
    from apps.hazards.models import HazardReport
    queryset = HazardReport.objects.filter(reporter=request.user).order_by("-created_at")
    serializer = HazardReportSerializer(queryset, many=True, context={"request": request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema(
    tags=["auth"],
    summary="Get user dashboard summary metrics",
    description="Returns aggregate counts and metrics for the logged-in citizen's personal dashboard.",
    responses={200: {"type": "object"}},
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_summary_view(request):
    """Returns aggregated stats for the citizen commuter dashboard."""
    from django.db.models import Sum
    from apps.hazards.models import HazardReport, HazardStatus

    user_reports = HazardReport.objects.filter(reporter=request.user)

    total_count = user_reports.count()
    active_count = user_reports.filter(status=HazardStatus.REPORTED).count()
    confirmed_count = user_reports.filter(status=HazardStatus.COMMUNITY_CONFIRMED).count()
    resolved_count = user_reports.filter(status=HazardStatus.RESOLVED).count()

    confirmations_received = user_reports.aggregate(total=Sum("confirmations_count"))["total"] or 0
    recent_reports = HazardReportSerializer(
        user_reports.order_by("-created_at")[:5],
        many=True,
        context={"request": request}
    ).data

    return Response({
        "metrics": {
            "total_reports": total_count,
            "active_reports": active_count,
            "confirmed_reports": confirmed_count,
            "resolved_reports": resolved_count,
            "confirmations_received": confirmations_received,
        },
        "recent_reports": recent_reports,
    }, status=status.HTTP_200_OK)


@extend_schema(
    tags=["auth"],
    summary="Update citizen profile",
    description="Allows updating display name and email address.",
    request=UserProfileUpdateSerializer,
    responses={200: UserPublicSerializer},
)
@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def profile_update_view(request):
    """Update display name or email for authenticated user."""
    from .models import UserProfile
    serializer = UserProfileUpdateSerializer(data=request.data, context={"request": request})
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = request.user
    if "display_name" in serializer.validated_data:
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.display_name = serializer.validated_data["display_name"]
        profile.save(update_fields=["display_name", "updated_at"])

    if "email" in serializer.validated_data:
        user.email = serializer.validated_data["email"]
        user.save(update_fields=["email"])

    from django.contrib.auth.models import User
    user = User.objects.select_related("profile").get(pk=user.pk)
    return Response(UserPublicSerializer(user).data, status=status.HTTP_200_OK)

