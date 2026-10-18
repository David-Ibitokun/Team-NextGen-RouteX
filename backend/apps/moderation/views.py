from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes
from apps.hazards.models import HazardReport, HazardStatus
from apps.hazards.serializers import HazardReportSerializer
from .models import ModerationAction
from .serializers import ModerationActionSerializer, ModerationActionCreateSerializer

class IsModeratorOrAdmin(BasePermission):
    """
    Allows access only to authenticated users with staff status or
    moderator/admin role in their UserProfile.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_staff or request.user.is_superuser:
            return True
        try:
            return request.user.profile.role in ["moderator", "admin"]
        except Exception:
            return False

@extend_schema(
    tags=["moderation"],
    summary="List hazard reports for moderation review",
    description="Retrieve reports pending moderator inspection, flagged reports, or filtered by status.",
    parameters=[
        OpenApiParameter(
            name="status",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description="Filter by report status.",
        ),
        OpenApiParameter(
            name="category",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description="Filter by hazard category.",
        ),
        OpenApiParameter(
            name="search",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description="Search keyword matching description or location landmark.",
        ),
        OpenApiParameter(
            name="ordering",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description="Sort order (-flags_count, -created_at, created_at, -confirmations_count).",
        ),
        OpenApiParameter(
            name="flagged_only",
            type=OpenApiTypes.BOOL,
            location=OpenApiParameter.QUERY,
            description="If true, only returns reports that have 1 or more flags.",
        ),
    ],
    responses={200: HazardReportSerializer(many=True)},
)
@api_view(["GET"])
@permission_classes([IsModeratorOrAdmin])
def moderation_reports_list(request):
    from django.db.models import Q
    queryset = HazardReport.objects.all()

    status_filter = request.query_params.get("status")
    if status_filter and status_filter != "all":
        queryset = queryset.filter(status=status_filter)

    category_filter = request.query_params.get("category")
    if category_filter and category_filter != "all":
        queryset = queryset.filter(category=category_filter)

    search_filter = request.query_params.get("search")
    if search_filter:
        s = search_filter.strip()
        queryset = queryset.filter(
            Q(description__icontains=s) | Q(location_name__icontains=s)
        )

    flagged_only = request.query_params.get("flagged_only")
    if flagged_only is not None and flagged_only.lower() in ("true", "1", "yes"):
        queryset = queryset.filter(flags_count__gt=0)

    ordering_param = request.query_params.get("ordering", "-flags_count")
    valid_orderings = ["-flags_count", "-created_at", "created_at", "-confirmations_count", "confirmations_count"]
    if ordering_param in valid_orderings:
        queryset = queryset.order_by(ordering_param, "-created_at")
    else:
        queryset = queryset.order_by("-flags_count", "-created_at")

    from rest_framework.pagination import PageNumberPagination

    paginate_param = request.query_params.get("paginate")
    page_param = request.query_params.get("page")
    page_size_param = request.query_params.get("page_size")

    if page_param or page_size_param or (paginate_param and paginate_param.lower() in ("true", "1")):
        paginator = PageNumberPagination()
        if page_size_param:
            try:
                paginator.page_size = max(1, min(100, int(page_size_param)))
            except ValueError:
                pass
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = HazardReportSerializer(page, many=True, context={"request": request})
            return paginator.get_paginated_response(serializer.data)

    serializer = HazardReportSerializer(queryset, many=True, context={"request": request})
    return Response(serializer.data, status=status.HTTP_200_OK)

@extend_schema(
    tags=["moderation"],
    summary="Apply moderation action to a report",
    description="Applies review, confirm, resolve, or reject to a report and records the reason.",
    request=ModerationActionCreateSerializer,
    responses={
        200: HazardReportSerializer,
        400: {"description": "Invalid action or reason"},
        404: {"description": "Report not found"},
    },
)
@api_view(["POST"])
@permission_classes([IsModeratorOrAdmin])
def moderation_report_action(request, pk):
    try:
        report = HazardReport.objects.get(pk=pk)
    except HazardReport.DoesNotExist:
        return Response({"detail": "Report not found."}, status=status.HTTP_404_NOT_FOUND)

    serializer = ModerationActionCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    action = serializer.validated_data["action"]
    reason = serializer.validated_data["reason"]

    # Map action to report status
    action_status_map = {
        "review": HazardStatus.UNDER_REVIEW,
        "confirm": HazardStatus.COMMUNITY_CONFIRMED,
        "resolve": HazardStatus.RESOLVED,
        "reject": HazardStatus.REJECTED,
    }

    new_status = action_status_map.get(action)
    if new_status:
        report.status = new_status
        report.save(update_fields=["status"])

    action_record = ModerationAction.objects.create(
        report=report,
        moderator=request.user,
        action=action,
        reason=reason,
    )

    updated_report = HazardReportSerializer(report, context={"request": request}).data
    return Response({
        "message": f"Report marked as {report.get_status_display()}.",
        "report": updated_report,
        "action": ModerationActionSerializer(action_record).data,
    }, status=status.HTTP_200_OK)

@extend_schema(
    tags=["moderation"],
    summary="Get moderation history for a report",
    description="Returns all logged moderation actions performed on a report.",
    responses={200: ModerationActionSerializer(many=True)},
)
@api_view(["GET"])
@permission_classes([IsModeratorOrAdmin])
def moderation_report_history(request, pk):
    try:
        report = HazardReport.objects.get(pk=pk)
    except HazardReport.DoesNotExist:
        return Response({"detail": "Report not found."}, status=status.HTTP_404_NOT_FOUND)

    actions = report.moderation_actions.all().order_by("-created_at")
    serializer = ModerationActionSerializer(actions, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema(
    tags=["moderation"],
    summary="Get moderator dashboard metrics",
    description="Returns counts of pending flags, active reports, under-review reports, and resolved items.",
    responses={200: {"type": "object"}},
)
@api_view(["GET"])
@permission_classes([IsModeratorOrAdmin])
def moderation_stats_view(request):
    """Returns aggregated stats for the Moderator Trust & Safety dashboard."""
    pending_flags_count = HazardReport.objects.filter(flags_count__gt=0).count()
    under_review_count = HazardReport.objects.filter(status=HazardStatus.UNDER_REVIEW).count()
    active_count = HazardReport.objects.filter(status=HazardStatus.REPORTED).count()
    confirmed_count = HazardReport.objects.filter(status=HazardStatus.COMMUNITY_CONFIRMED).count()
    resolved_count = HazardReport.objects.filter(status=HazardStatus.RESOLVED).count()
    total_actions_count = ModerationAction.objects.count()

    return Response({
        "pending_flags": pending_flags_count,
        "under_review": under_review_count,
        "active_reported": active_count,
        "confirmed": confirmed_count,
        "resolved": resolved_count,
        "total_actions": total_actions_count,
    }, status=status.HTTP_200_OK)


@extend_schema(
    tags=["moderation"],
    summary="Get all moderation audit history",
    description="Returns recent moderation actions across all reports with reasons and moderator usernames.",
    responses={200: ModerationActionSerializer(many=True)},
)
@api_view(["GET"])
@permission_classes([IsModeratorOrAdmin])
def moderation_all_history_view(request):
    """Returns recent moderation actions across the entire platform."""
    actions = ModerationAction.objects.all().select_related("report", "moderator").order_by("-created_at")[:50]
    serializer = ModerationActionSerializer(actions, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

