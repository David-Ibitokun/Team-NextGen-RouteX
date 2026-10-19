"""
Views for RouteX AI Assistant Endpoints
"""

import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiResponse

from apps.hazards.models import HazardReport
from .serializers import (
    SuggestCategoryRequestSerializer,
    SuggestCategoryResponseSerializer,
    ImproveDescriptionRequestSerializer,
    ImproveDescriptionResponseSerializer,
    SummarizeReportRequestSerializer,
    SummarizeReportResponseSerializer,
    CheckDuplicatesRequestSerializer,
    CheckDuplicatesResponseSerializer,
    AiErrorResponseSerializer,
)
from .services import (
    GeminiService,
    AiAssistantError,
    AiServiceUnavailableError,
    AiTimeoutError,
    AiQuotaExceededError,
)

logger = logging.getLogger(__name__)


def handle_ai_exception(exc: Exception) -> Response:
    """Helper to translate AI exceptions into standard DRF responses."""
    if isinstance(exc, AiAssistantError):
        return Response(
            {"error": exc.message, "code": exc.code},
            status=exc.status_code,
        )
    logger.exception("Unexpected AI error: %s", str(exc))
    return Response(
        {
            "error": "An unexpected error occurred while processing the AI request.",
            "code": "ai_internal_error",
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


class SuggestCategoryView(APIView):
    """
    Suggests the most accurate RouteX road hazard category based on report description text.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["ai"],
        summary="Suggest Hazard Category",
        description="Analyzes the provided description text using Google Gemini to suggest one of the 5 RouteX hazard categories.",
        request=SuggestCategoryRequestSerializer,
        responses={
            200: SuggestCategoryResponseSerializer,
            400: OpenApiResponse(description="Validation error in description text"),
            401: OpenApiResponse(description="Authentication credentials were not provided"),
            503: AiErrorResponseSerializer,
        },
    )
    def post(self, request):
        serializer = SuggestCategoryRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        description = serializer.validated_data["description"]
        selected = serializer.validated_data.get("selected_category")

        try:
            result = GeminiService.suggest_category(description, selected_category=selected)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as exc:
            return handle_ai_exception(exc)


class ImproveDescriptionView(APIView):
    """
    Polishes description text for spelling, grammar, and readability without adding unobserved facts.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["ai"],
        summary="Improve Hazard Description",
        description="Refines user-drafted hazard description to improve clarity and grammar while strictly preserving the author's observed reality.",
        request=ImproveDescriptionRequestSerializer,
        responses={
            200: ImproveDescriptionResponseSerializer,
            400: OpenApiResponse(description="Validation error"),
            401: OpenApiResponse(description="Unauthenticated"),
            503: AiErrorResponseSerializer,
        },
    )
    def post(self, request):
        serializer = ImproveDescriptionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        description = serializer.validated_data["description"]

        try:
            result = GeminiService.improve_description(description)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as exc:
            return handle_ai_exception(exc)


class SummarizeReportView(APIView):
    """
    Generates a concise 1-2 sentence neutral summary of an existing hazard report.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["ai"],
        summary="Summarize Hazard Report",
        description="Fetches an existing verified hazard report by ID and generates a neutral, objective public summary.",
        request=SummarizeReportRequestSerializer,
        responses={
            200: SummarizeReportResponseSerializer,
            400: OpenApiResponse(description="Validation error"),
            404: OpenApiResponse(description="Hazard report not found"),
            503: AiErrorResponseSerializer,
        },
    )
    def post(self, request):
        serializer = SummarizeReportRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        report_id = serializer.validated_data["report_id"]

        try:
            report = HazardReport.objects.get(id=report_id)
        except HazardReport.DoesNotExist:
            return Response(
                {"error": "Hazard report not found.", "code": "not_found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            result = GeminiService.summarize_report(report)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as exc:
            return handle_ai_exception(exc)


class CheckDuplicatesView(APIView):
    """
    Heuristic hybrid duplicate detector combining spatial radius, time window, and semantic AI.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["ai"],
        summary="Check Duplicate Hazards",
        description="Performs a two-stage duplicate scan: deterministic geographic radius check + Gemini semantic description comparison.",
        request=CheckDuplicatesRequestSerializer,
        responses={
            200: CheckDuplicatesResponseSerializer,
            400: OpenApiResponse(description="Validation error"),
            401: OpenApiResponse(description="Unauthenticated"),
            503: AiErrorResponseSerializer,
        },
    )
    def post(self, request):
        serializer = CheckDuplicatesRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        try:
            result = GeminiService.check_duplicates(
                latitude=float(data["latitude"]),
                longitude=float(data["longitude"]),
                description=data["description"],
                category=data.get("category", ""),
                radius_km=data.get("radius_km", 1.0),
                hours_window=data.get("hours_window", 48),
                exclude_report_id=data.get("exclude_report_id"),
            )
            return Response(result, status=status.HTTP_200_OK)
        except Exception as exc:
            return handle_ai_exception(exc)
