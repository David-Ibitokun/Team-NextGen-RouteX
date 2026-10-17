from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from .validators import validate_latitude, validate_longitude, validate_hazard_photo

class HazardCategory(models.TextChoices):
    FLOODING = "flooding", "Flooding / Standing Water"
    POTHOLE = "pothole", "Pothole / Road Damage"
    BLOCKED_ROAD = "blocked_road", "Blocked Road / Obstruction"
    FALLEN_TREE = "fallen_tree", "Fallen Tree / Debris"
    OTHER = "other", "Other Hazard"

class HazardStatus(models.TextChoices):
    REPORTED = "reported", "Reported"
    UNDER_REVIEW = "under_review", "Under Review"
    COMMUNITY_CONFIRMED = "community_confirmed", "Community Confirmed"
    RESOLVED = "resolved", "Resolved"
    REJECTED = "rejected", "Rejected / Inaccurate"

class HazardReport(models.Model):
    category = models.CharField(
        max_length=30,
        choices=HazardCategory.choices,
        help_text="Primary category of the road hazard."
    )
    location_label = models.CharField(
        max_length=150,
        blank=True,
        help_text="Descriptive location name, landmark, or street (e.g. 'Oshodi-Isolo Expressway near Toyota Bus Stop')."
    )
    description = models.TextField(
        max_length=1000,
        help_text="Detailed description of the hazard and road condition."
    )
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        validators=[validate_latitude],
        help_text="GPS latitude coordinate (-90.0 to 90.0)."
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        validators=[validate_longitude],
        help_text="GPS longitude coordinate (-180.0 to 180.0)."
    )
    status = models.CharField(
        max_length=30,
        choices=HazardStatus.choices,
        default=HazardStatus.REPORTED,
        help_text="Current verification/moderation status."
    )
    photo = models.ImageField(
        upload_to="hazards/%Y/%m/",
        blank=True,
        null=True,
        validators=[validate_hazard_photo],
        help_text="Optional photographic evidence."
    )
    reporter = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="hazard_reports",
        help_text="Registered reporter, or null for anonymous/guest submission."
    )
    confirmations_count = models.PositiveIntegerField(
        default=0,
        help_text="Count of community confirmations."
    )
    flags_count = models.PositiveIntegerField(
        default=0,
        help_text="Count of community flags for review."
    )
    is_demo = models.BooleanField(
        default=False,
        help_text="Flag indicating this report is seeded demo data for development/preview."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "category"]),
            models.Index(fields=["latitude", "longitude"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        label = self.location_label or f"({self.latitude}, {self.longitude})"
        return f"[{self.get_category_display()}] {label} - {self.get_status_display()}"

    @property
    def freshness_info(self):
        """Calculate human-readable freshness and age."""
        now = timezone.now()
        delta = now - self.created_at
        total_seconds = int(delta.total_seconds())

        if total_seconds < 60:
            return {"label": "Just now", "is_stale": False, "minutes_ago": 0}
        elif total_seconds < 3600:
            minutes = total_seconds // 60
            return {
                "label": f"Reported {minutes} {'minute' if minutes == 1 else 'minutes'} ago",
                "is_stale": False,
                "minutes_ago": minutes
            }
        elif total_seconds < 86400:
            hours = total_seconds // 3600
            return {
                "label": f"Reported {hours} {'hour' if hours == 1 else 'hours'} ago",
                "is_stale": False,
                "hours_ago": hours
            }
        else:
            days = total_seconds // 86400
            return {
                "label": f"Reported {days} {'day' if days == 1 else 'days'} ago",
                "is_stale": days >= 2,
                "days_ago": days
            }

class Confirmation(models.Model):
    report = models.ForeignKey(HazardReport, on_delete=models.CASCADE, related_name="confirmations")
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    session_key = models.CharField(max_length=64, blank=True, help_text="Session hash for guest confirmation deduplication")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["report", "user"],
                condition=models.Q(user__isnull=False),
                name="unique_user_report_confirmation",
            )
        ]

    def __str__(self):
        return f"Confirmation for #{self.report_id} at {self.created_at}"

class HazardFlag(models.Model):
    REASON_CHOICES = [
        ("cleared", "Hazard has been cleared / is no longer present"),
        ("inaccurate", "Inaccurate location or details"),
        ("duplicate", "Duplicate of another report"),
        ("spam", "Spam, offensive, or abuse"),
        ("other", "Other reason"),
    ]

    report = models.ForeignKey(HazardReport, on_delete=models.CASCADE, related_name="flags")
    reporter = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    reason = models.CharField(max_length=40, choices=REASON_CHOICES)
    notes = models.TextField(max_length=500, blank=True)
    status = models.CharField(max_length=20, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Flag on #{self.report_id} for {self.reason}"
