"""
RouteX Administration Views
Strictly protected by IsPlatformAdmin permission.
Provides API endpoints for the custom frontend Admin Dashboard:
- Platform-wide operational metrics
- User and role management
- Operational settings configuration
- System audit log inspection
"""
from django.contrib.auth.models import User
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes

from apps.accounts.models import UserProfile, PlatformSettings, SystemAuditLog
from apps.accounts.permissions import IsPlatformAdmin
from apps.accounts.serializers import (
    AdminUserSerializer,
    UserRoleUpdateSerializer,
    PlatformSettingsSerializer,
    SystemAuditLogSerializer,
)
from apps.hazards.models import HazardReport, HazardStatus
from apps.moderation.models import ModerationAction


@extend_schema(
    tags=["admin"],
    summary="Get platform overview statistics",
    description="Returns platform-wide metrics across users, hazards, and moderation for administrators.",
    responses={200: {"type": "object"}},
)
@api_view(["GET"])
@permission_classes([IsPlatformAdmin])
def admin_stats_view(request):
    """Calculates real-time platform statistics for the Admin Dashboard."""
    # User metrics
    total_users = User.objects.count()
    admins_count = User.objects.filter(Q(is_superuser=True) | Q(profile__role="admin")).distinct().count()
    moderators_count = User.objects.filter(
        Q(profile__role="moderator") | (Q(is_staff=True) & ~Q(is_superuser=True) & ~Q(profile__role="admin"))
    ).distinct().count()
    citizens_count = max(0, total_users - admins_count - moderators_count)

    # Hazard metrics
    total_hazards = HazardReport.objects.count()
    active_hazards = HazardReport.objects.filter(status=HazardStatus.REPORTED).count()
    confirmed_hazards = HazardReport.objects.filter(status=HazardStatus.COMMUNITY_CONFIRMED).count()
    under_review_hazards = HazardReport.objects.filter(status=HazardStatus.UNDER_REVIEW).count()
    resolved_hazards = HazardReport.objects.filter(status=HazardStatus.RESOLVED).count()
    flagged_hazards = HazardReport.objects.filter(flags_count__gt=0).count()
    demo_hazards = HazardReport.objects.filter(is_demo=True).count()

    # Moderation metrics
    total_moderation_actions = ModerationAction.objects.count()
    settings = PlatformSettings.get_settings()

    return Response({
        "users": {
            "total": total_users,
            "citizens": citizens_count,
            "moderators": moderators_count,
            "admins": admins_count,
        },
        "hazards": {
            "total": total_hazards,
            "active": active_hazards,
            "confirmed": confirmed_hazards,
            "under_review": under_review_hazards,
            "resolved": resolved_hazards,
            "flagged": flagged_hazards,
            "demo": demo_hazards,
        },
        "moderation": {
            "total_actions": total_moderation_actions,
            "pending_flags": flagged_hazards,
        },
        "settings": {
            "confirmation_threshold": settings.confirmation_threshold,
            "freshness_hours": settings.freshness_hours,
            "max_upload_size_mb": settings.max_upload_size_mb,
            "allow_anonymous_map_view": settings.allow_anonymous_map_view,
        },
        "system": {
            "status": "healthy",
            "server_time": timezone.now().isoformat(),
            "framework": "Django 5.1 / DRF",
        }
    }, status=status.HTTP_200_OK)


@extend_schema(
    tags=["admin"],
    summary="List users for administrative management",
    description="Retrieve all registered users with search by username/email and role filtering.",
    parameters=[
        OpenApiParameter("q", OpenApiTypes.STR, OpenApiParameter.QUERY, description="Search username or email"),
        OpenApiParameter("role", OpenApiTypes.STR, OpenApiParameter.QUERY, description="Filter by role: citizen, moderator, admin"),
    ],
    responses={200: AdminUserSerializer(many=True)},
)
@api_view(["GET"])
@permission_classes([IsPlatformAdmin])
def admin_users_list_view(request):
    """Returns users with role, submission counts, and activity timestamps."""
    users = User.objects.all().select_related("profile").prefetch_related("hazard_reports", "confirmation_set").order_by("-date_joined")

    query = request.query_params.get("q", "").strip()
    if query:
        users = users.filter(Q(username__icontains=query) | Q(email__icontains=query))

    role_filter = request.query_params.get("role", "").strip().lower()
    if role_filter == "admin":
        users = users.filter(Q(is_superuser=True) | Q(profile__role="admin"))
    elif role_filter == "moderator":
        users = users.filter(Q(profile__role="moderator") | (Q(is_staff=True) & ~Q(is_superuser=True) & ~Q(profile__role="admin")))
    elif role_filter == "citizen":
        users = users.filter(~Q(is_superuser=True) & ~Q(is_staff=True) & (Q(profile__role="citizen") | Q(profile__role="")))

    serializer = AdminUserSerializer(users, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema(
    tags=["admin"],
    summary="Update a user's role",
    description="Promotes or demotes a user to citizen, moderator, or admin. Requires IsPlatformAdmin.",
    request=UserRoleUpdateSerializer,
    responses={
        200: AdminUserSerializer,
        400: {"description": "Invalid role or self-demotion prevented"},
        404: {"description": "User not found"},
    },
)
@api_view(["PATCH"])
@permission_classes([IsPlatformAdmin])
def admin_user_role_update_view(request, user_id):
    """Updates a user's role with validation safeguards and audit logging."""
    try:
        target_user = User.objects.select_related("profile").get(pk=user_id)
    except User.DoesNotExist:
        return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

    serializer = UserRoleUpdateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    new_role = serializer.validated_data["role"]
    reason = serializer.validated_data.get("reason", "").strip()

    # Prevent admin from accidentally demoting themselves if they are the current user
    if target_user.pk == request.user.pk and new_role != "admin":
        return Response(
            {"detail": "You cannot remove administrative privileges from your own active session."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    profile, _ = UserProfile.objects.get_or_create(user=target_user)
    old_role = profile.role
    profile.role = new_role

    # Sync staff flag for moderator/admin roles
    if new_role in ["moderator", "admin"]:
        target_user.is_staff = True
    else:
        target_user.is_staff = False

    target_user.save(update_fields=["is_staff"])
    profile.save(update_fields=["role", "updated_at"])

    # Record administrative audit trail
    audit_detail = f"Changed role of user '{target_user.username}' (ID #{target_user.pk}) from '{old_role}' to '{new_role}'."
    if reason:
        audit_detail += f" Reason: {reason}"

    SystemAuditLog.objects.create(
        actor=request.user,
        action_type="ROLE_CHANGE",
        target_id=str(target_user.pk),
        details=audit_detail,
    )

    target_user = User.objects.select_related("profile").get(pk=target_user.pk)
    return Response(AdminUserSerializer(target_user).data, status=status.HTTP_200_OK)


@extend_schema(
    tags=["admin"],
    summary="Delete a user account",
    description="Permanently deletes a user account with safeguards (cannot delete self or the last superuser). Requires IsPlatformAdmin.",
    responses={
        200: {"description": "User account successfully deleted"},
        400: {"description": "Self-deletion or last superuser deletion blocked"},
        404: {"description": "User not found"},
    },
)
@api_view(["DELETE"])
@permission_classes([IsPlatformAdmin])
def admin_user_delete_view(request, user_id):
    """Permanently deletes a user account with safeguards and audit logging."""
    try:
        target_user = User.objects.select_related("profile").get(pk=user_id)
    except User.DoesNotExist:
        return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

    # Prevent admin from deleting their own active account
    if target_user.pk == request.user.pk:
        return Response(
            {"detail": "You cannot delete your own active administrative account."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Prevent deleting the last superuser
    if target_user.is_superuser:
        superuser_count = User.objects.filter(is_superuser=True).count()
        if superuser_count <= 1:
            return Response(
                {"detail": "Cannot delete the sole remaining superuser account."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    username = target_user.username
    email = target_user.email
    user_pk = target_user.pk

    # Record deletion audit log before removing target user
    SystemAuditLog.objects.create(
        actor=request.user,
        action_type="USER_DELETION",
        target_id=str(user_pk),
        details=f"Permanently deleted user account '{username}' (ID #{user_pk}, Email: {email or 'None'}).",
    )

    # Delete the user (Hazard reports & confirmations have on_delete=SET_NULL to preserve public road safety data)
    target_user.delete()

    return Response(
        {"detail": f"User account @{username} has been permanently deleted."},
        status=status.HTTP_200_OK,
    )



@extend_schema(
    tags=["admin"],
    summary="Get or update platform operational settings",
    description="Retrieve or update operational rules (confirmation threshold, freshness window, upload limits).",
    request=PlatformSettingsSerializer,
    responses={200: PlatformSettingsSerializer},
)
@api_view(["GET", "PATCH"])
@permission_classes([IsPlatformAdmin])
def admin_settings_view(request):
    """Handles retrieval and live mutation of platform operational settings."""
    settings_obj = PlatformSettings.get_settings()

    if request.method == "GET":
        serializer = PlatformSettingsSerializer(settings_obj)
        return Response(serializer.data, status=status.HTTP_200_OK)

    serializer = PlatformSettingsSerializer(settings_obj, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    serializer.save(updated_by=request.user)

    # Log changes
    changed_keys = ", ".join(request.data.keys())
    SystemAuditLog.objects.create(
        actor=request.user,
        action_type="SETTINGS_UPDATE",
        target_id="1",
        details=f"Updated platform operational settings: {changed_keys}.",
    )

    return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema(
    tags=["admin"],
    summary="Retrieve system audit logs",
    description="Returns chronological audit logs of all administrative and moderation events.",
    responses={200: SystemAuditLogSerializer(many=True)},
)
@api_view(["GET"])
@permission_classes([IsPlatformAdmin])
def admin_audit_logs_view(request):
    """Returns chronological audit trail for platform administrators."""
    logs = SystemAuditLog.objects.all().select_related("actor")[:100]
    serializer = SystemAuditLogSerializer(logs, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)
