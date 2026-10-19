"""
Serializers for RouteX AI Assistant Endpoints
"""

from decimal import Decimal
from rest_framework import serializers
from apps.hazards.models import HazardCategory


class SuggestCategoryRequestSerializer(serializers.Serializer):
    description = serializers.CharField(
        min_length=5,
        max_length=3000,
        required=True,
        help_text="Detailed hazard description to classify.",
    )
    selected_category = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        help_text="Currently selected category if any.",
    )


class SuggestCategoryResponseSerializer(serializers.Serializer):
    suggested_category = serializers.CharField()
    category_display = serializers.CharField()
    confidence = serializers.FloatField()
    reason = serializers.CharField()
    disclaimer = serializers.CharField()


class ImproveDescriptionRequestSerializer(serializers.Serializer):
    description = serializers.CharField(
        min_length=5,
        max_length=3000,
        required=True,
        help_text="Draft hazard description to improve for clarity and grammar.",
    )


class ImproveDescriptionResponseSerializer(serializers.Serializer):
    original_description = serializers.CharField()
    suggested_description = serializers.CharField()
    changes_made = serializers.CharField()
    disclaimer = serializers.CharField()


class SummarizeReportRequestSerializer(serializers.Serializer):
    report_id = serializers.IntegerField(
        required=True,
        min_value=1,
        help_text="Primary key of the hazard report to summarize.",
    )


class SummarizeReportResponseSerializer(serializers.Serializer):
    report_id = serializers.IntegerField()
    category = serializers.CharField()
    category_display = serializers.CharField()
    location_label = serializers.CharField(allow_blank=True, allow_null=True)
    summary = serializers.CharField()
    urgency_level = serializers.CharField()
    disclaimer = serializers.CharField()


class DuplicateCandidateSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    category = serializers.CharField()
    category_display = serializers.CharField()
    location_label = serializers.CharField(allow_blank=True, allow_null=True)
    description = serializers.CharField()
    status = serializers.CharField()
    confirmations_count = serializers.IntegerField()
    distance_km = serializers.FloatField()
    distance_meters = serializers.IntegerField()
    created_at = serializers.CharField()
    similarity_score = serializers.FloatField()
    is_likely_same_hazard = serializers.BooleanField()
    match_rationale = serializers.CharField()


class CheckDuplicatesRequestSerializer(serializers.Serializer):
    latitude = serializers.DecimalField(
        max_digits=9,
        decimal_places=6,
        required=True,
        min_value=Decimal("-90.0"),
        max_value=Decimal("90.0"),
        help_text="Latitude coordinate for duplicate search center.",
    )
    longitude = serializers.DecimalField(
        max_digits=9,
        decimal_places=6,
        required=True,
        min_value=Decimal("-180.0"),
        max_value=Decimal("180.0"),
        help_text="Longitude coordinate for duplicate search center.",
    )
    description = serializers.CharField(
        min_length=5,
        max_length=3000,
        required=True,
        help_text="Draft description to compare against existing reports.",
    )
    category = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        help_text="Optional proposed category.",
    )
    radius_km = serializers.FloatField(
        required=False,
        default=1.0,
        min_value=0.1,
        max_value=5.0,
        help_text="Search radius in kilometers (0.1 to 5.0).",
    )
    hours_window = serializers.IntegerField(
        required=False,
        default=48,
        min_value=1,
        max_value=168,
        help_text="Time window in hours to inspect (1 to 168).",
    )
    exclude_report_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text="Optional report ID to exclude from search (e.g. self when editing).",
    )


class CheckDuplicatesResponseSerializer(serializers.Serializer):
    is_possible_duplicate = serializers.BooleanField()
    nearby_count = serializers.IntegerField()
    candidates = DuplicateCandidateSerializer(many=True)
    analysis = serializers.CharField()
    disclaimer = serializers.CharField()


class AiErrorResponseSerializer(serializers.Serializer):
    error = serializers.CharField()
    code = serializers.CharField()
    detail = serializers.CharField(required=False)
