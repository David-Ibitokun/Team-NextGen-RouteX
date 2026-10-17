from decimal import Decimal
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status

from apps.accounts.models import UserProfile
from apps.hazards.models import HazardReport, HazardCategory, HazardStatus
from apps.moderation.models import ModerationAction

class ModerationAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.citizen = User.objects.create_user(username="citizen", email="c@test.com", password="Password123!")
        UserProfile.objects.create(user=self.citizen, role="citizen")

        self.moderator = User.objects.create_user(username="moderator", email="m@test.com", password="Password123!")
        UserProfile.objects.create(user=self.moderator, role="moderator")

        self.staff_admin = User.objects.create_user(username="staff", email="s@test.com", password="Password123!", is_staff=True)
        UserProfile.objects.create(user=self.staff_admin, role="admin")

        self.report = HazardReport.objects.create(
            category=HazardCategory.FLOODING,
            location_label="Marina, Lagos Island",
            description="Deep water blocking roadway.",
            latitude=Decimal("6.453100"),
            longitude=Decimal("3.395800"),
            status=HazardStatus.REPORTED,
            reporter=self.citizen,
            flags_count=1,
        )

        self.list_url = reverse("moderation-reports-list")
        self.action_url = reverse("moderation-report-action", kwargs={"pk": self.report.pk})
        self.history_url = reverse("moderation-report-history", kwargs={"pk": self.report.pk})

    def test_unauthenticated_and_citizen_rejected(self):
        """Criterion 17: Anonymous and normal citizen users are rejected with 401/403."""
        # Anonymous
        anon_res = self.client.get(self.list_url)
        self.assertEqual(anon_res.status_code, status.HTTP_403_FORBIDDEN)

        # Citizen
        self.client.force_authenticate(user=self.citizen)
        citizen_list = self.client.get(self.list_url)
        self.assertEqual(citizen_list.status_code, status.HTTP_403_FORBIDDEN)

        citizen_action = self.client.post(self.action_url, {"action": "resolve", "reason": "Looks clear"}, format="json")
        self.assertEqual(citizen_action.status_code, status.HTTP_403_FORBIDDEN)

    def test_moderator_can_list_and_act_on_reports(self):
        """Criterion 14 & 17: Moderator can list reports, apply documented action with reason, and view audit trail."""
        self.client.force_authenticate(user=self.moderator)

        # List reports
        list_res = self.client.get(self.list_url)
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_res.data), 1)

        # Moderation action: mark under review
        review_res = self.client.post(self.action_url, {
            "action": "review",
            "reason": "Investigating reports of standing water depth."
        }, format="json")
        self.assertEqual(review_res.status_code, status.HTTP_200_OK)
        self.report.refresh_from_db()
        self.assertEqual(self.report.status, HazardStatus.UNDER_REVIEW)

        # History audit log
        history_res = self.client.get(self.history_url)
        self.assertEqual(history_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(history_res.data), 1)
        self.assertEqual(history_res.data[0]["action"], "review")
        self.assertEqual(history_res.data[0]["reason"], "Investigating reports of standing water depth.")
