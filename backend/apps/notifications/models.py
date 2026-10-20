from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class NotificationType(models.TextChoices):
    HAZARD_REPORTED = "hazard_reported", "Hazard Reported"
    HAZARD_CONFIRMED = "hazard_confirmed", "Hazard Confirmed"
    STATUS_CHANGED = "status_changed", "Status Changed"
    HAZARD_FLAGGED = "hazard_flagged", "Hazard Flagged"
    SAFETY_ADVISORY = "safety_advisory", "Safety Advisory"
    SYSTEM = "system", "System Notice"


class Notification(models.Model):
    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notifications",
        help_text="User who receives this notification."
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sent_notifications",
        help_text="User or moderator who initiated the action (null if system)."
    )
    notification_type = models.CharField(
        max_length=30,
        choices=NotificationType.choices,
        default=NotificationType.SYSTEM,
        help_text="Categorical type of the notification event."
    )
    title = models.CharField(max_length=200)
    body = models.TextField(max_length=1000)
    target_hazard = models.ForeignKey(
        "hazards.HazardReport",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
        help_text="Associated hazard report if applicable."
    )
    is_read = models.BooleanField(default=False, db_index=True)
    read_at = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["recipient", "is_read"]),
            models.Index(fields=["recipient", "-created_at"]),
        ]

    def __str__(self):
        return f"[{self.get_notification_type_display()}] To: {self.recipient.username} - {self.title}"

    def mark_as_read(self):
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=["is_read", "read_at"])


class DevicePushToken(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="device_tokens",
        help_text="Associated authenticated user."
    )
    token = models.CharField(
        max_length=255,
        unique=True,
        help_text="Expo Push Token or device registration ID."
    )
    platform = models.CharField(
        max_length=20,
        default="expo",
        help_text="Client platform: expo, android, ios, or web."
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Active status for delivery dispatch."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.user.username} ({self.platform}): {self.token[:20]}..."
