from decimal import Decimal
from django.db.models import F
from rest_framework import viewsets, status, serializers as drf_serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from drf_spectacular.utils import (
    extend_schema,
    extend_schema_view,
    OpenApiParameter,
    OpenApiTypes,
    inline_serializer,
)

from .models import HazardReport, Confirmation, HazardFlag, HazardCategory, HazardStatus
from .serializers import (
    HazardReportSerializer,
    ConfirmationSerializer,
    HazardFlagSerializer,
)

from rest_framework.authentication import SessionAuthentication, BasicAuthentication

class CsrfExemptSessionAuthentication(SessionAuthentication):
    def enforce_csrf(self, request):
        return  # Allow mobile and web clients to submit and confirm reports without CSRF failures

class ConfirmationResponseSerializer(drf_serializers.Serializer):
    message = drf_serializers.CharField()
    confirmations_count = drf_serializers.IntegerField()

@extend_schema_view(
    list=extend_schema(
        tags=["hazards"],
        summary="List community road hazards",
        description=(
            "Retrieve a paginated list of road hazard reports. "
            "Supports filtering by category, status, demo status, or a geographic bounding box (bbox=west,south,east,north or min_lat, max_lat, min_lng, max_lng)."
        ),
        parameters=[
            OpenApiParameter(
                name="category",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Filter by hazard category (flooding, pothole, blocked_road, fallen_tree, other).",
                enum=HazardCategory.values,
            ),
            OpenApiParameter(
                name="status",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Filter by status (reported, under_review, community_confirmed, resolved, rejected).",
                enum=HazardStatus.values,
            ),
            OpenApiParameter(
                name="demo",
                type=OpenApiTypes.BOOL,
                location=OpenApiParameter.QUERY,
                description="Filter by demo data flag (true or false).",
            ),
            OpenApiParameter(
                name="bbox",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Bounding box coordinates in format: west,south,east,north",
            ),
            OpenApiParameter(
                name="min_lat",
                type=OpenApiTypes.DECIMAL,
                location=OpenApiParameter.QUERY,
                description="Minimum latitude for bounding-box search.",
            ),
            OpenApiParameter(
                name="max_lat",
                type=OpenApiTypes.DECIMAL,
                location=OpenApiParameter.QUERY,
                description="Maximum latitude for bounding-box search.",
            ),
            OpenApiParameter(
                name="min_lng",
                type=OpenApiTypes.DECIMAL,
                location=OpenApiParameter.QUERY,
                description="Minimum longitude for bounding-box search.",
            ),
            OpenApiParameter(
                name="max_lng",
                type=OpenApiTypes.DECIMAL,
                location=OpenApiParameter.QUERY,
                description="Maximum longitude for bounding-box search.",
            ),
        ],
    ),
    retrieve=extend_schema(
        tags=["hazards"],
        summary="Retrieve hazard report details",
        description="Fetch detailed information for a single road hazard report, including category, status, freshness, and photo.",
    ),
    create=extend_schema(
        tags=["hazards"],
        summary="Submit a new road hazard report",
        description=(
            "Submit a community hazard report with category, location coordinates, optional street landmark, "
            "description, and optional photo file (JPEG, PNG, WebP up to 5MB)."
        ),
    ),
)
class HazardReportViewSet(viewsets.ModelViewSet):
    """
    API endpoint for browsing and reporting community road hazards.
    Supports filtering by category, status, is_demo, and geographic bounding box.
    """
    serializer_class = HazardReportSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    authentication_classes = [CsrfExemptSessionAuthentication, BasicAuthentication]
    permission_classes = [AllowAny]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        queryset = HazardReport.objects.all()

        # Category filter
        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(category=category)

        # Status filter
        report_status = self.request.query_params.get("status")
        if report_status:
            queryset = queryset.filter(status=report_status)

        # Demo data filter (e.g. ?demo=true, ?demo=false)
        demo_param = self.request.query_params.get("demo")
        if demo_param is not None:
            is_demo = demo_param.lower() in ("true", "1", "yes")
            queryset = queryset.filter(is_demo=is_demo)

        # Bounding box filter: ?bbox=west,south,east,north
        bbox = self.request.query_params.get("bbox")
        if bbox:
            try:
                parts = [p.strip() for p in bbox.split(",")]
                if len(parts) == 4:
                    west, south, east, north = [Decimal(p) for p in parts]
                    queryset = queryset.filter(
                        latitude__gte=south,
                        latitude__lte=north,
                        longitude__gte=west,
                        longitude__lte=east,
                    )
            except Exception:
                pass

        # Individual coordinate bounds: ?min_lat=...&max_lat=...&min_lng=...&max_lng=...
        try:
            min_lat = self.request.query_params.get("min_lat")
            max_lat = self.request.query_params.get("max_lat")
            min_lng = self.request.query_params.get("min_lng")
            max_lng = self.request.query_params.get("max_lng")

            if all(v is not None for v in [min_lat, max_lat, min_lng, max_lng]):
                queryset = queryset.filter(
                    latitude__gte=Decimal(min_lat),
                    latitude__lte=Decimal(max_lat),
                    longitude__gte=Decimal(min_lng),
                    longitude__lte=Decimal(max_lng),
                )
        except Exception:
            pass

        return queryset

    def perform_create(self, serializer):
        reporter = self.request.user if self.request.user.is_authenticated else None
        serializer.save(reporter=reporter)

    @extend_schema(
        tags=["hazards"],
        summary="Confirm hazard presence",
        description="Increments community confirmation count. Enforces duplicate check and updates status to community_confirmed at threshold (3).",
        request=None,
        responses={200: ConfirmationResponseSerializer},
    )
    @action(detail=True, methods=["post"], url_path="confirm", permission_classes=[AllowAny])
    def confirm(self, request, pk=None):
        """Confirm that a hazard remains present at this location."""
        report = self.get_object()
        user = request.user if request.user.is_authenticated else None

        # Prevent duplicate confirmation
        if user:
            if Confirmation.objects.filter(report=report, user=user).exists():
                return Response(
                    {"detail": "You have already confirmed this hazard report."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            Confirmation.objects.create(
                report=report,
                user=user,
            )
        else:
            session_key = request.session.session_key
            if not session_key:
                try:
                    request.session.save()
                    session_key = request.session.session_key
                except Exception:
                    session_key = None

            client_id = session_key or request.META.get("HTTP_X_FORWARDED_FOR", request.META.get("REMOTE_ADDR", "guest"))
            if Confirmation.objects.filter(report=report, session_key=client_id).exists():
                return Response(
                    {"detail": "You have already confirmed this hazard report."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            Confirmation.objects.create(
                report=report,
                user=None,
                session_key=client_id,
            )

        # Update counter and check threshold (3 confirmations = community_confirmed)
        CONFIRMATION_THRESHOLD = 3
        new_count = report.confirmations.count()
        report.confirmations_count = new_count
        if new_count >= CONFIRMATION_THRESHOLD and report.status == HazardStatus.REPORTED:
            report.status = HazardStatus.COMMUNITY_CONFIRMED
        report.save(update_fields=["confirmations_count", "status"])

        return Response(
            {
                "message": "Hazard presence confirmed.",
                "confirmations_count": report.confirmations_count,
                "status": report.status,
            },
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        tags=["hazards"],
        summary="Flag a hazard report",
        description="Submit a moderation flag if a report is cleared, inaccurate, a duplicate, or abusive.",
        request=HazardFlagSerializer,
        responses={201: HazardFlagSerializer},
    )
    @action(detail=True, methods=["post"], url_path="flags", permission_classes=[AllowAny])
    def flag(self, request, pk=None):
        """Flag a report for moderator review."""
        report = self.get_object()
        user = request.user if request.user.is_authenticated else None
        reason = request.data.get("reason", "other")
        notes = request.data.get("notes", "")

        # Prevent duplicate pending flag on same report by same user
        if user and HazardFlag.objects.filter(report=report, reporter=user, status="pending").exists():
            return Response(
                {"detail": "You have already submitted a pending flag for this report."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        flag_instance = HazardFlag.objects.create(
            report=report,
            reporter=user,
            reason=reason,
            notes=notes,
        )

        report.flags_count = report.flags.count()
        report.save(update_fields=["flags_count"])

        serializer = HazardFlagSerializer(flag_instance)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
