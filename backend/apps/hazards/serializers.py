import base64
import uuid
from django.core.files.base import ContentFile
from rest_framework import serializers
from .models import HazardReport, HazardCategory, HazardStatus, Confirmation, HazardFlag

class HazardReportSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source="get_category_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    photo_url = serializers.SerializerMethodField()
    freshness = serializers.SerializerMethodField()

    def to_internal_value(self, data):
        if isinstance(data, dict):
            data = data.copy() if hasattr(data, 'copy') else dict(data)
            # Automatically round GPS coordinates to 6 decimal places
            if "latitude" in data and data["latitude"] is not None:
                try:
                    data["latitude"] = f"{float(data['latitude']):.6f}"
                except (ValueError, TypeError):
                    pass
            if "longitude" in data and data["longitude"] is not None:
                try:
                    data["longitude"] = f"{float(data['longitude']):.6f}"
                except (ValueError, TypeError):
                    pass

            # Support base64 image strings from mobile and web apps
            if "photo_base64" in data and data["photo_base64"]:
                try:
                    b64_data = data["photo_base64"]
                    format_prefix, imgstr = b64_data.split(';base64,') if ';base64,' in b64_data else ('', b64_data)
                    ext = 'jpg'
                    if 'png' in format_prefix:
                        ext = 'png'
                    elif 'webp' in format_prefix:
                        ext = 'webp'
                    file_name = f"hazard_{uuid.uuid4().hex[:8]}.{ext}"
                    data["photo"] = ContentFile(base64.b64decode(imgstr), name=file_name)
                except Exception:
                    pass
        return super().to_internal_value(data)

    class Meta:
        model = HazardReport
        fields = [
            "id",
            "category",
            "category_display",
            "location_label",
            "description",
            "latitude",
            "longitude",
            "status",
            "status_display",
            "photo",
            "photo_url",
            "confirmations_count",
            "flags_count",
            "is_demo",
            "created_at",
            "updated_at",
            "freshness",
        ]
        read_only_fields = [
            "id",
            "status",
            "status_display",
            "category_display",
            "confirmations_count",
            "flags_count",
            "is_demo",
            "created_at",
            "updated_at",
            "photo_url",
            "freshness",
        ]

    def get_photo_url(self, obj):
        if obj.photo:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None

    def get_freshness(self, obj):
        return obj.freshness_info

    def validate_category(self, value):
        if value not in HazardCategory.values:
            valid_cats = ", ".join(HazardCategory.values)
            raise serializers.ValidationError(f"Invalid category '{value}'. Choose from: {valid_cats}.")
        return value

    def validate_description(self, value):
        stripped = value.strip()
        if len(stripped) < 5:
            raise serializers.ValidationError("Please provide at least 5 characters describing the road hazard.")
        if len(stripped) > 1000:
            raise serializers.ValidationError("Description cannot exceed 1000 characters.")
        return stripped

    def validate_location_label(self, value):
        if value and len(value.strip()) > 150:
            raise serializers.ValidationError("Location label cannot exceed 150 characters.")
        return value.strip() if value else ""

class ConfirmationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Confirmation
        fields = ["id", "report", "created_at"]
        read_only_fields = ["id", "created_at"]

class HazardFlagSerializer(serializers.ModelSerializer):
    class Meta:
        model = HazardFlag
        fields = ["id", "report", "reason", "notes", "created_at"]
        read_only_fields = ["id", "created_at"]
