from rest_framework import serializers
from apps.hazards.serializers import HazardReportSerializer
from .models import ModerationAction

class ModerationActionSerializer(serializers.ModelSerializer):
    moderator_name = serializers.SerializerMethodField()

    class Meta:
        model = ModerationAction
        fields = [
            "id",
            "report",
            "moderator",
            "moderator_name",
            "action",
            "reason",
            "created_at",
        ]
        read_only_fields = ["id", "moderator", "moderator_name", "created_at"]

    def get_moderator_name(self, obj):
        if not obj.moderator:
            return "System / Anonymous"
        try:
            return obj.moderator.profile.display_name or obj.moderator.username
        except Exception:
            return obj.moderator.username

class ModerationActionCreateSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=ModerationAction.ACTION_CHOICES)
    reason = serializers.CharField(min_length=3, max_length=500)
