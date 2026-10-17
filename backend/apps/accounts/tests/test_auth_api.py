from django.test import TestCase
from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status

from apps.accounts.models import UserProfile

class AuthAPITests(TestCase):
    def setUp(self):
        self.client = APIClient(enforce_csrf_checks=False)
        self.register_url = reverse("auth-register")
        self.login_url = reverse("auth-login")
        self.logout_url = reverse("auth-logout")
        self.me_url = reverse("auth-me")
        self.csrf_url = reverse("auth-csrf")

    def test_registration_succeeds_with_valid_data(self):
        """Criterion 1: User registration succeeds with valid data."""
        payload = {
            "username": "bolaji",
            "email": "bolaji@example.com",
            "password": "StrongPassword2026!",
            "password_confirm": "StrongPassword2026!",
            "display_name": "Bolaji Sanusi",
        }
        response = self.client.post(self.register_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["username"], "bolaji")
        self.assertEqual(response.data["display_name"], "Bolaji Sanusi")
        self.assertEqual(response.data["role"], "citizen")
        self.assertTrue(User.objects.filter(username="bolaji").exists())

    def test_duplicate_email_registration_rejected(self):
        """Criterion 2: Duplicate email registration is rejected."""
        User.objects.create_user(username="existing", email="existing@example.com", password="Password123!")
        payload = {
            "username": "newuser",
            "email": "existing@example.com",
            "password": "StrongPassword2026!",
        }
        response = self.client.post(self.register_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_invalid_or_mismatched_password_rejected(self):
        """Criterion 3: Invalid or mismatched passwords are rejected."""
        # Mismatched password
        payload_mismatch = {
            "username": "mismatchuser",
            "email": "mismatch@example.com",
            "password": "StrongPassword2026!",
            "password_confirm": "DifferentPassword123!",
        }
        res_mismatch = self.client.post(self.register_url, payload_mismatch, format="json")
        self.assertEqual(res_mismatch.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password_confirm", res_mismatch.data)

        # Too short password
        payload_short = {
            "username": "shortuser",
            "email": "short@example.com",
            "password": "123",
            "password_confirm": "123",
        }
        res_short = self.client.post(self.register_url, payload_short, format="json")
        self.assertEqual(res_short.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_and_logout_flow(self):
        """Criteria 4 & 5: Login succeeds with valid credentials, fails with invalid, and logout invalidates session."""
        user = User.objects.create_user(
            username="kemi",
            email="kemi@example.com",
            password="StrongPassword2026!",
        )
        UserProfile.objects.create(user=user, display_name="Kemi Adeleke")

        # Invalid login
        bad_res = self.client.post(self.login_url, {"username": "kemi", "password": "WrongPassword"}, format="json")
        self.assertEqual(bad_res.status_code, status.HTTP_401_UNAUTHORIZED)

        # Valid login with username
        good_res = self.client.post(self.login_url, {"username": "kemi", "password": "StrongPassword2026!"}, format="json")
        self.assertEqual(good_res.status_code, status.HTTP_200_OK)
        self.assertEqual(good_res.data["username"], "kemi")
        self.assertEqual(good_res.data["display_name"], "Kemi Adeleke")

        # Current user endpoint (Criterion 6)
        me_res = self.client.get(self.me_url)
        self.assertEqual(me_res.status_code, status.HTTP_200_OK)
        self.assertEqual(me_res.data["username"], "kemi")

        # Logout (Criterion 5)
        logout_res = self.client.post(self.logout_url)
        self.assertEqual(logout_res.status_code, status.HTTP_200_OK)

        # After logout, me endpoint returns 401/403 unauthenticated
        me_after_logout = self.client.get(self.me_url)
        self.assertIn(me_after_logout.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_csrf_token_endpoint(self):
        """Criterion 7: CSRF bootstrap endpoint returns valid token and sets cookie."""
        response = self.client.get(self.csrf_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("csrfToken", response.data)
        self.assertTrue(len(response.data["csrfToken"]) > 10)
