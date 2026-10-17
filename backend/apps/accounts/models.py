from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    ROLE_CHOICES = [
        ("citizen", "Citizen"),
        ("moderator", "Moderator"),
        ("admin", "Administrator"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    display_name = models.CharField(max_length=80, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="citizen")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.display_name or self.user.username} ({self.role})"


class PlatformSettings(models.Model):
    """
    Singleton model holding operational parameters configured by Administrators.
    Enforces rules for report freshness, confirmation thresholds, and uploads.
    """
    confirmation_threshold = models.PositiveIntegerField(
        default=3,
        help_text="Number of distinct confirmations required to auto-transition report to community_confirmed."
    )
    freshness_hours = models.PositiveIntegerField(
        default=24,
        help_text="Hours after which an unconfirmed report is considered stale."
    )
    max_upload_size_mb = models.PositiveIntegerField(
        default=5,
        help_text="Maximum allowed photo upload size in megabytes."
    )
    allow_anonymous_map_view = models.BooleanField(
        default=True,
        help_text="Allow unauthenticated visitors to view the hazard map and report details."
    )
    emergency_notice_enabled = models.BooleanField(
        default=True,
        help_text="Display emergency service advisory disclaimers on reporting flows."
    )
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="settings_updates"
    )

    class Meta:
        verbose_name = "Platform Setting"
        verbose_name_plural = "Platform Settings"

    @classmethod
    def get_settings(cls):
        obj, _ = cls.objects.get_or_create(id=1)
        return obj

    def __str__(self):
        return f"Platform Settings (Freshness: {self.freshness_hours}h, Confirm Threshold: {self.confirmation_threshold})"


class SystemAuditLog(models.Model):
    """
    Audit log tracking administrative actions such as role assignments,
    operational setting updates, and administrative overrides.
    """
    ACTION_CHOICES = [
        ("ROLE_CHANGE", "User Role Change"),
        ("SETTINGS_UPDATE", "Platform Settings Update"),
        ("USER_SUSPENSION", "User Account Status Update"),
        ("HAZARD_OVERRIDE", "Administrative Hazard Override"),
    ]

    actor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="admin_actions"
    )
    action_type = models.CharField(max_length=30, choices=ACTION_CHOICES)
    target_id = models.CharField(max_length=100, blank=True)
    details = models.TextField(max_length=1000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        actor_name = self.actor.username if self.actor else "System"
        return f"[{self.action_type}] by {actor_name} at {self.created_at}"
