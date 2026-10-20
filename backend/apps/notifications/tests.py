from decimal import Decimal
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import UserProfile
from apps.hazards.models import HazardReport, HazardCategory, HazardStatus
from apps.notifications.models import Notification, NotificationType, DevicePushToken
from apps.notifications.services import NotificationService


class NotificationsAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_reporter = User.objects.create_user(
            username="reporter1", email="reporter1@example.com", password="password123"
        )
        UserProfile.objects.create(user=self.user_reporter, role="citizen")

        self.user_confirmer = User.objects.create_user(
            username="confirmer1", email="confirmer1@example.com", password="password123"
        )
        UserProfile.objects.create(user=self.user_confirmer, role="citizen")

        self.user_moderator = User.objects.create_user(
            username="mod1", email="mod1@example.com", password="password123"
        )
        UserProfile.objects.create(user=self.user_moderator, role="moderator")

        self.hazard = HazardReport.objects.create(
            category=HazardCategory.FLOODING,
            location_label="Lekki Expressway",
            description="Deep water crossing roadway",
            latitude=Decimal("6.442800"),
            longitude=Decimal("3.483900"),
            reporter=self.user_reporter,
        )

    def test_unread_count_and_mark_read(self):
        NotificationService.send_notification(
            recipient=self.user_reporter,
            notification_type=NotificationType.HAZARD_REPORTED,
            title="Hazard Reported",
            body="Report received.",
            target_hazard=self.hazard,
        )

        self.client.force_authenticate(user=self.user_reporter)
        resp = self.client.get("/api/v1/notifications/unread-count/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["unread_count"], 1)

        notif = Notification.objects.filter(recipient=self.user_reporter).first()
        read_resp = self.client.patch(f"/api/v1/notifications/{notif.id}/read/")
        self.assertEqual(read_resp.status_code, status.HTTP_200_OK)
        self.assertTrue(read_resp.data["is_read"])

        count_resp = self.client.get("/api/v1/notifications/unread-count/")
        self.assertEqual(count_resp.data["unread_count"], 0)

    def test_notifications_list_unauthenticated(self):
        resp = self.client.get("/api/v1/notifications/")
        self.assertIn(resp.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_notifications_list_authenticated(self):
        NotificationService.send_notification(
            recipient=self.user_reporter,
            notification_type=NotificationType.HAZARD_REPORTED,
            title="Report 1",
            body="Body 1",
        )
        self.client.force_authenticate(user=self.user_reporter)
        resp = self.client.get("/api/v1/notifications/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["count"], 1)
        self.assertEqual(resp.data["results"][0]["title"], "Report 1")

    def test_mark_all_read(self):
        NotificationService.send_notification(
            recipient=self.user_reporter,
            notification_type=NotificationType.SYSTEM,
            title="System Notice 1",
            body="Update available",
        )
        NotificationService.send_notification(
            recipient=self.user_reporter,
            notification_type=NotificationType.SYSTEM,
            title="System Notice 2",
            body="Maintenance complete",
        )

        self.client.force_authenticate(user=self.user_reporter)
        resp = self.client.post("/api/v1/notifications/mark-all-read/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["marked_read"], 2)

        unread_count = Notification.objects.filter(recipient=self.user_reporter, is_read=False).count()
        self.assertEqual(unread_count, 0)

    def test_device_token_registration(self):
        self.client.force_authenticate(user=self.user_reporter)
        payload = {
            "token": "ExponentPushToken[xxxxxxxxxxxxxx]",
            "platform": "expo",
        }
        resp = self.client.post("/api/v1/notifications/devices/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(DevicePushToken.objects.filter(user=self.user_reporter).count(), 1)

    def test_broadcast_advisory_permissions(self):
        # Citizen cannot broadcast
        self.client.force_authenticate(user=self.user_reporter)
        payload = {
            "corridor": "Lekki-Epe Expressway",
            "title": "Severe Flash Flood Advisory",
            "message": "Water levels rising quickly. Please take alternative routes.",
        }
        resp = self.client.post("/api/v1/notifications/broadcast/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

        # Moderator can broadcast
        self.client.force_authenticate(user=self.user_moderator)
        resp = self.client.post("/api/v1/notifications/broadcast/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.data["recipients_count"] >= 3)

        # Reporter received broadcast notification
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.user_reporter,
                notification_type=NotificationType.SAFETY_ADVISORY,
            ).exists()
        )

    def test_hazard_confirmation_triggers_reporter_notification(self):
        self.client.force_authenticate(user=self.user_confirmer)
        resp = self.client.post(f"/api/v1/hazards/{self.hazard.id}/confirm/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        # Reporter must have received notification
        notif = Notification.objects.filter(
            recipient=self.user_reporter,
            notification_type=NotificationType.HAZARD_CONFIRMED,
        ).first()
        self.assertIsNotNone(notif)
        self.assertIn("Lekki Expressway", notif.body)

    def test_moderator_action_triggers_status_notification(self):
        self.client.force_authenticate(user=self.user_moderator)
        resp = self.client.post(
            f"/api/v1/moderation/reports/{self.hazard.id}/action/",
            {"action": "resolve", "reason": "Water receded and road cleared by local drainage team."},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        notif = Notification.objects.filter(
            recipient=self.user_reporter,
            notification_type=NotificationType.STATUS_CHANGED,
        ).first()
        self.assertIsNotNone(notif)
        self.assertIn("resolved", notif.body.lower())
        self.assertIn("drainage", notif.body.lower())
