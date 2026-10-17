from rest_framework import serializers
from .models import HazardReport, HazardCategory, HazardStatus, Confirmation, HazardFlag

class HazardReportSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source="get_category_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    photo_url = serializers.SerializerMethodField()
    freshness = serializers.SerializerMethodField()

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
