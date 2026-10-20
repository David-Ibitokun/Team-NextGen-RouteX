from rest_framework import serializers
from apps.notifications.models import Notification, DevicePushToken


class NotificationSerializer(serializers.ModelSerializer):
    target_hazard_id = serializers.IntegerField(source="target_hazard.id", read_only=True, allow_null=True)
    target_hazard_category = serializers.CharField(source="target_hazard.category", read_only=True, allow_null=True)
    target_hazard_location = serializers.CharField(source="target_hazard.location_label", read_only=True, allow_null=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "notification_type",
            "title",
            "body",
            "target_hazard_id",
            "target_hazard_category",
            "target_hazard_location",
            "is_read",
            "read_at",
            "metadata",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "notification_type",
            "title",
            "body",
            "target_hazard_id",
            "target_hazard_category",
            "target_hazard_location",
            "read_at",
            "metadata",
            "created_at",
        ]


class DevicePushTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = DevicePushToken
        fields = ["token", "platform", "is_active", "created_at"]
        read_only_fields = ["created_at"]

    def validate_token(self, value):
        v = value.strip()
        if not v:
            raise serializers.ValidationError("Device token cannot be empty.")
        return v


class BroadcastAdvisorySerializer(serializers.Serializer):
    corridor = serializers.CharField(max_length=150, required=False, allow_blank=True, default="")
    title = serializers.CharField(max_length=200, required=True)
    message = serializers.CharField(max_length=1000, required=True)
