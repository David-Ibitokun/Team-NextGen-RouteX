from django.test import TestCase, override_settings
from django.urls import reverse
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.core.cache import cache
from django.core import mail
from rest_framework.test import APIClient
from rest_framework import status

from apps.accounts.models import UserProfile


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    DEFAULT_FROM_EMAIL="noreply@routex.org",
    FRONTEND_URL="http://localhost:5173",
)
class PasswordResetAPITests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient(enforce_csrf_checks=False)
        self.user = User.objects.create_user(
            username="oluwaseun",
            email="oluwaseun@example.com",
            password="OriginalPassword2026!",
        )
        UserProfile.objects.create(user=self.user, display_name="Oluwaseun Bakare")
        self.request_url = reverse("auth-password-reset-request")
        self.validate_url = reverse("auth-password-reset-validate")
        self.confirm_url = reverse("auth-password-reset-confirm")

    def test_password_reset_request_sends_email_for_existing_user(self):
        """Reset request with a valid user email sends an email containing the reset link."""
        mail.outbox = []
        response = self.client.post(self.request_url, {"email": "oluwaseun@example.com"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("detail", response.data)

        self.assertEqual(len(mail.outbox), 1)
        sent_email = mail.outbox[0]
        self.assertEqual(sent_email.to, ["oluwaseun@example.com"])
        self.assertEqual(sent_email.subject, "Reset your RouteX password")
        self.assertIn("Reset My Password", sent_email.body + (sent_email.alternatives[0][0] if sent_email.alternatives else ""))
        self.assertIn("http://localhost:5173/reset-password?uid=", sent_email.body + (sent_email.alternatives[0][0] if sent_email.alternatives else ""))

    def test_password_reset_request_nonexistent_email_does_not_leak_enumeration(self):
        """Non-registered email returns generic 200 response without sending emails."""
        mail.outbox = []
        response = self.client.post(self.request_url, {"email": "nobody@example.com"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("detail", response.data)
        self.assertEqual(len(mail.outbox), 0)

    def test_validate_token_endpoint(self):
        """Validating token returns 200 for valid token and 400 for invalid/tampered token."""
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)

        # Valid token
        res_valid = self.client.post(self.validate_url, {"uid": uid, "token": token}, format="json")
        self.assertEqual(res_valid.status_code, status.HTTP_200_OK)
        self.assertTrue(res_valid.data.get("valid"))

        # Invalid token
        res_invalid = self.client.post(self.validate_url, {"uid": uid, "token": "invalid-token-123"}, format="json")
        self.assertEqual(res_invalid.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(res_invalid.data.get("valid"))

    def test_password_reset_confirm_flow(self):
        """User can confirm password reset with valid token and successfully sign in with new password."""
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)

        payload = {
            "uid": uid,
            "token": token,
            "new_password": "BrandNewSecurePassword2026!",
            "new_password_confirm": "BrandNewSecurePassword2026!",
        }

        response = self.client.post(self.confirm_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("detail", response.data)

        # Verify old password no longer works
        login_old = self.client.post(reverse("auth-login"), {
            "username": "oluwaseun",
            "password": "OriginalPassword2026!",
        }, format="json")
        self.assertEqual(login_old.status_code, status.HTTP_401_UNAUTHORIZED)

        # Verify new password works
        login_new = self.client.post(reverse("auth-login"), {
            "username": "oluwaseun",
            "password": "BrandNewSecurePassword2026!",
        }, format="json")
        self.assertEqual(login_new.status_code, status.HTTP_200_OK)

        # Verify token cannot be re-used
        reuse_res = self.client.post(self.confirm_url, payload, format="json")
        self.assertEqual(reuse_res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_password_reset_confirm_rejects_mismatch(self):
        """Confirmation rejects mismatching passwords."""
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)

        payload = {
            "uid": uid,
            "token": token,
            "new_password": "BrandNewSecurePassword2026!",
            "new_password_confirm": "DifferentPassword2026!",
        }

        response = self.client.post(self.confirm_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("new_password_confirm", response.data)

    def test_password_reset_cooldown_enforced(self):
        """Requesting password reset twice within 2 minutes is rate-limited with 429."""
        mail.outbox = []
        res1 = self.client.post(self.request_url, {"email": "oluwaseun@example.com"}, format="json")
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertEqual(res1.data.get("retry_after"), 120)

        # Immediate second attempt should be blocked with 429
        res2 = self.client.post(self.request_url, {"email": "oluwaseun@example.com"}, format="json")
        self.assertEqual(res2.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertIn("retry_after", res2.data)
        self.assertIn("Please wait", res2.data["detail"])
        # Outbox still only has 1 email sent
        self.assertEqual(len(mail.outbox), 1)
