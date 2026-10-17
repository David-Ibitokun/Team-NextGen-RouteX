from django.test import TestCase
from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status

from apps.accounts.models import UserProfile, PlatformSettings, SystemAuditLog
from apps.hazards.models import HazardReport, HazardCategory, HazardStatus


class RolePermissionsTests(TestCase):
    def setUp(self):
        self.client = APIClient(enforce_csrf_checks=False)

        # Create Citizen User
        self.citizen = User.objects.create_user(
            username="citizen_user",
            email="citizen@example.com",
            password="Password123!"
        )
        UserProfile.objects.create(user=self.citizen, display_name="Citizen User", role="citizen")

        # Create Moderator User
        self.moderator = User.objects.create_user(
            username="moderator_user",
            email="mod@example.com",
            password="Password123!",
            is_staff=True,
        )
        UserProfile.objects.create(user=self.moderator, display_name="Mod User", role="moderator")

        # Create Admin User
        self.admin = User.objects.create_user(
            username="admin_user",
            email="admin@example.com",
            password="Password123!",
            is_superuser=True,
        )
        UserProfile.objects.create(user=self.admin, display_name="Admin User", role="admin")

        # Create sample hazard
        self.hazard = HazardReport.objects.create(
            category=HazardCategory.POTHOLE,
            description="Deep pothole test",
            latitude=6.5,
            longitude=3.3,
            reporter=self.citizen,
            flags_count=1,
        )

        # URLs
        self.admin_stats_url = reverse("admin-stats")
        self.admin_users_url = reverse("admin-users-list")
        self.admin_settings_url = reverse("admin-settings")
        self.moderation_stats_url = reverse("moderation-stats")
        self.moderation_history_url = reverse("moderation-all-history")
        self.dashboard_summary_url = reverse("auth-dashboard-summary")
        self.profile_update_url = reverse("auth-profile-update")

    def test_anonymous_cannot_access_admin_stats(self):
        """Anonymous visitor must receive 401 or 403 Forbidden for admin endpoints."""
        res = self.client.get(self.admin_stats_url)
        self.assertIn(res.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_citizen_forbidden_from_admin_stats(self):
        """Registered citizen must receive 403 Forbidden for admin endpoints."""
        self.client.force_authenticate(user=self.citizen)
        res = self.client.get(self.admin_stats_url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_moderator_forbidden_from_admin_stats(self):
        """Moderator must receive 403 Forbidden for admin endpoints."""
        self.client.force_authenticate(user=self.moderator)
        res = self.client.get(self.admin_stats_url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_access_admin_stats(self):
        """Platform administrator can access admin stats with 200 OK."""
        self.client.force_authenticate(user=self.admin)
        res = self.client.get(self.admin_stats_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("users", res.data)
        self.assertIn("hazards", res.data)
        self.assertIn("settings", res.data)

    def test_admin_can_list_and_search_users(self):
        """Admin can list and filter users by search term."""
        self.client.force_authenticate(user=self.admin)
        res = self.client.get(self.admin_users_url, {"q": "citizen"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(len(res.data) >= 1)
        self.assertEqual(res.data[0]["username"], "citizen_user")

    def test_admin_can_promote_citizen_to_moderator(self):
        """Admin can promote a citizen to moderator with audit log."""
        self.client.force_authenticate(user=self.admin)
        url = reverse("admin-user-role-update", kwargs={"user_id": self.citizen.id})
        res = self.client.patch(url, {"role": "moderator", "reason": "Trusted volunteer"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["role"], "moderator")

        self.citizen.refresh_from_db()
        self.assertEqual(self.citizen.profile.role, "moderator")
        self.assertTrue(self.citizen.is_staff)

        # Verify audit log
        self.assertTrue(SystemAuditLog.objects.filter(target_id=str(self.citizen.id)).exists())

    def test_admin_cannot_demote_themselves(self):
        """Admin cannot remove administrative privileges from their own session."""
        self.client.force_authenticate(user=self.admin)
        url = reverse("admin-user-role-update", kwargs={"user_id": self.admin.id})
        res = self.client.patch(url, {"role": "citizen"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_can_update_platform_settings(self):
        """Admin can update operational parameters like confirmation threshold."""
        self.client.force_authenticate(user=self.admin)
        payload = {"confirmation_threshold": 5, "freshness_hours": 48}
        res = self.client.patch(self.admin_settings_url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["confirmation_threshold"], 5)
        self.assertEqual(res.data["freshness_hours"], 48)

    def test_citizen_can_get_dashboard_summary(self):
        """Registered citizen can view aggregate statistics for their reports."""
        self.client.force_authenticate(user=self.citizen)
        res = self.client.get(self.dashboard_summary_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["metrics"]["total_reports"], 1)

    def test_citizen_can_update_profile(self):
        """Citizen can update their display name."""
        self.client.force_authenticate(user=self.citizen)
        res = self.client.patch(self.profile_update_url, {"display_name": "Updated Citizen Name"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["display_name"], "Updated Citizen Name")

    def test_moderator_can_access_moderation_stats(self):
        """Moderator can view moderation queue stats."""
        self.client.force_authenticate(user=self.moderator)
        res = self.client.get(self.moderation_stats_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["pending_flags"], 1)

    def test_citizen_forbidden_from_moderation_stats(self):
        """Regular citizen cannot access moderation stats."""
        self.client.force_authenticate(user=self.citizen)
        res = self.client.get(self.moderation_stats_url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
