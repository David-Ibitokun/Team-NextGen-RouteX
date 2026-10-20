from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes

from apps.notifications.models import Notification, DevicePushToken
from apps.notifications.serializers import (
    NotificationSerializer,
    DevicePushTokenSerializer,
    BroadcastAdvisorySerializer,
)
from apps.notifications.services import NotificationService
from apps.moderation.views import IsModeratorOrAdmin


class NotificationPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


@extend_schema(
    tags=["notifications"],
    summary="List user notifications",
    description="Retrieve paginated notifications for the authenticated user, optionally filtered by read status or category type.",
    parameters=[
        OpenApiParameter(
            name="unread",
            type=OpenApiTypes.BOOL,
            location=OpenApiParameter.QUERY,
            description="If true, returns only unread notifications.",
        ),
        OpenApiParameter(
            name="type",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description="Filter by notification type (hazard_reported, hazard_confirmed, status_changed, etc.).",
        ),
        OpenApiParameter(
            name="page",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
            description="Page number.",
        ),
        OpenApiParameter(
            name="page_size",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
            description="Items per page (default: 20, max: 100).",
        ),
    ],
    responses={200: NotificationSerializer(many=True)},
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def notifications_list(request):
    queryset = Notification.objects.filter(recipient=request.user).select_related("target_hazard")

    unread_param = request.query_params.get("unread")
    if unread_param is not None and unread_param.lower() in ("true", "1", "yes"):
        queryset = queryset.filter(is_read=False)

    type_param = request.query_params.get("type")
    if type_param:
        queryset = queryset.filter(notification_type=type_param)

    paginator = NotificationPagination()
    page = paginator.paginate_queryset(queryset, request)
    serializer = NotificationSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)


@extend_schema(
    tags=["notifications"],
    summary="Get unread notification count",
    description="Returns the total count of unread notifications for the authenticated user.",
    responses={200: {"type": "object", "properties": {"unread_count": {"type": "integer"}}}},
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def notifications_unread_count(request):
    count = Notification.objects.filter(recipient=request.user, is_read=False).count()
    return Response({"unread_count": count}, status=status.HTTP_200_OK)


@extend_schema(
    tags=["notifications"],
    summary="Mark notification as read",
    description="Marks a specific notification owned by the authenticated user as read.",
    responses={200: NotificationSerializer},
)
@api_view(["PATCH", "POST"])
@permission_classes([IsAuthenticated])
def notification_mark_read(request, pk):
    try:
        notif = Notification.objects.get(pk=pk, recipient=request.user)
    except Notification.DoesNotExist:
        return Response({"detail": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)

    notif.mark_as_read()
    return Response(NotificationSerializer(notif).data, status=status.HTTP_200_OK)


@extend_schema(
    tags=["notifications"],
    summary="Mark all notifications as read",
    description="Marks all unread notifications for the authenticated user as read.",
    responses={200: {"type": "object", "properties": {"marked_read": {"type": "integer"}}}},
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def notifications_mark_all_read(request):
    from django.utils import timezone
    now = timezone.now()
    updated = Notification.objects.filter(recipient=request.user, is_read=False).update(
        is_read=True, read_at=now
    )
    return Response({"message": "All notifications marked as read.", "marked_read": updated}, status=status.HTTP_200_OK)


@extend_schema(
    tags=["notifications"],
    summary="Delete notification",
    description="Permanently removes a notification from the user's notification list.",
    responses={200: {"type": "object", "properties": {"message": {"type": "string"}}}},
)
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def notification_delete(request, pk):
    try:
        notif = Notification.objects.get(pk=pk, recipient=request.user)
    except Notification.DoesNotExist:
        return Response({"detail": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)

    notif.delete()
    return Response({"message": "Notification deleted successfully."}, status=status.HTTP_200_OK)


@extend_schema(
    tags=["notifications"],
    summary="Register mobile push token",
    description="Registers or activates an Expo push token for the authenticated user's mobile device.",
    request=DevicePushTokenSerializer,
    responses={200: DevicePushTokenSerializer, 201: DevicePushTokenSerializer},
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def device_token_register(request):
    serializer = DevicePushTokenSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    token_str = serializer.validated_data["token"]
    platform = serializer.validated_data.get("platform", "expo")

    device_token, created = DevicePushToken.objects.update_or_create(
        token=token_str,
        defaults={
            "user": request.user,
            "platform": platform,
            "is_active": True,
        },
    )

    resp_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
    return Response(DevicePushTokenSerializer(device_token).data, status=resp_code)


@extend_schema(
    tags=["notifications"],
    summary="Broadcast corridor safety advisory",
    description="Allows staff, moderators, or administrators to broadcast a safety advisory to all active RouteX commuters.",
    request=BroadcastAdvisorySerializer,
    responses={200: {"type": "object", "properties": {"message": {"type": "string"}, "recipients_count": {"type": "integer"}}}},
)
@api_view(["POST"])
@permission_classes([IsModeratorOrAdmin])
def broadcast_advisory(request):
    serializer = BroadcastAdvisorySerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    corridor = serializer.validated_data.get("corridor", "").strip()
    title = serializer.validated_data["title"].strip()
    message = serializer.validated_data["message"].strip()

    count = NotificationService.broadcast_safety_advisory(
        corridor=corridor,
        title=title,
        message=message,
        author=request.user,
    )

    return Response({
        "message": f"Safety advisory successfully broadcast to {count} commuters.",
        "recipients_count": count,
    }, status=status.HTTP_200_OK)
