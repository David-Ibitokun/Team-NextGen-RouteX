from django.db import models
from django.contrib.auth.models import User

class ModerationAction(models.Model):
    ACTION_CHOICES = [
        ("review", "Mark Under Review"),
        ("confirm", "Mark Community Confirmed"),
        ("resolve", "Mark Resolved"),
        ("reject", "Reject / Mark Inaccurate"),
    ]

    report = models.ForeignKey(
        "hazards.HazardReport",
        on_delete=models.CASCADE,
        related_name="moderation_actions"
    )
    moderator = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="moderation_actions"
    )
    action = models.CharField(max_length=30, choices=ACTION_CHOICES)
    reason = models.TextField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Action {self.action} on report #{self.report_id} at {self.created_at}"
