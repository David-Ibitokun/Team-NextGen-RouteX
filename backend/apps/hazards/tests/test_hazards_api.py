from decimal import Decimal
import io
from PIL import Image
from django.test import TestCase
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status

from apps.hazards.models import HazardReport, HazardCategory, HazardStatus, Confirmation, HazardFlag

class HazardReportTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="testuser",
            email="testuser@example.com",
            password="StrongPassword123!",
        )
        self.other_user = User.objects.create_user(
            username="otheruser",
            email="otheruser@example.com",
            password="StrongPassword123!",
        )
        self.report = HazardReport.objects.create(
            category=HazardCategory.FLOODING,
            location_label="Marina, Lagos Island",
            description="Flooding near CMS bus stop reaching curb height.",
            latitude=Decimal("6.453100"),
            longitude=Decimal("3.395800"),
            status=HazardStatus.REPORTED,
            confirmations_count=0,
            reporter=self.user,
            is_demo=False,
        )
        self.demo_report = HazardReport.objects.create(
            category=HazardCategory.POTHOLE,
            location_label="Demo Hazard, Ikeja",
            description="Sample demo pothole on Obafemi Awolowo Way.",
            latitude=Decimal("6.595000"),
            longitude=Decimal("3.345000"),
            status=HazardStatus.REPORTED,
            is_demo=True,
        )

    def test_anonymous_can_list_and_view_public_reports(self):
        """Criterion 8: Anonymous users can list and view public reports."""
        url = reverse("hazard-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)
        self.assertEqual(len(response.data["results"]), 2)

        detail_url = reverse("hazard-detail", kwargs={"pk": self.report.pk})
        detail_res = self.client.get(detail_url)
        self.assertEqual(detail_res.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_res.data["location_label"], "Marina, Lagos Island")

    def test_anonymous_can_create_reports(self):
        """Anonymous/guest users can submit valid hazard reports without logging in."""
        url = reverse("hazard-list")
        payload = {
            "category": "pothole",
            "location_label": "Ikorodu Road",
            "description": "Deep crater in center lane.",
            "latitude": "6.541200",
            "longitude": "3.371800",
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["category"], "pothole")
        new_report = HazardReport.objects.get(pk=response.data["id"])
        self.assertIsNone(new_report.reporter)

    def test_anonymous_can_confirm_report(self):
        """Anonymous/guest users can confirm reports, with session deduplication."""
        url = reverse("hazard-confirm", kwargs={"pk": self.report.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["confirmations_count"], 1)

        # Repeated confirmation from same session client is rejected
        dup_res = self.client.post(url)
        self.assertEqual(dup_res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already confirmed", dup_res.data["detail"])

    def test_authenticated_can_create_valid_report_and_ownership_assigned(self):
        """Criteria 10 & 13: Authenticated user creates report and ownership is assigned by backend."""
        self.client.force_authenticate(user=self.user)
        url = reverse("hazard-list")
        payload = {
            "category": "pothole",
            "location_label": "Ikorodu Road by Palm Grove",
            "description": "Deep crater in center lane, slowing down evening traffic.",
            "latitude": "6.541200",
            "longitude": "3.371800",
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["category"], "pothole")
        self.assertEqual(response.data["status"], "reported")
        self.assertFalse(response.data["is_demo"])

        new_report = HazardReport.objects.get(pk=response.data["id"])
        self.assertEqual(new_report.reporter, self.user)

    def test_invalid_coordinates_rejected(self):
        """Criterion 11: Invalid latitude and longitude values are rejected."""
        self.client.force_authenticate(user=self.user)
        url = reverse("hazard-list")
        payload = {
            "category": "pothole",
            "description": "Dangerous pothole off the edge of the world.",
            "latitude": "95.500000",
            "longitude": "3.300000",
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("latitude", response.data)

        payload2 = {
            "category": "pothole",
            "description": "Dangerous pothole off the edge of the world.",
            "latitude": "6.500000",
            "longitude": "200.000000",
        }
        res2 = self.client.post(url, payload2, format="json")
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("longitude", res2.data)

    def test_photo_upload_valid_and_invalid(self):
        """Criterion 12: Invalid image uploads and oversized files are rejected."""
        self.client.force_authenticate(user=self.user)
        url = reverse("hazard-list")

        # Valid photo
        image_io = io.BytesIO()
        img = Image.new("RGB", (100, 100), color=(8, 127, 140))
        img.save(image_io, format="JPEG")
        image_io.seek(0)
        uploaded_file = SimpleUploadedFile("road_hazard.jpg", image_io.read(), content_type="image/jpeg")

        data = {
            "category": "blocked_road",
            "location_label": "Third Mainland Bridge",
            "description": "Broken down trailer blocking lane.",
            "latitude": "6.495000",
            "longitude": "3.393000",
            "photo": uploaded_file,
        }
        response = self.client.post(url, data, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNotNone(response.data["photo"])
        self.assertTrue(response.data["photo"].endswith(".webp"))

        # Invalid file format (text file pretending to be image)
        invalid_file = SimpleUploadedFile("fake.txt", b"not an image content", content_type="text/plain")
        data_invalid = {
            "category": "blocked_road",
            "description": "Broken down trailer blocking lane.",
            "latitude": "6.495000",
            "longitude": "3.393000",
            "photo": invalid_file,
        }
        bad_res = self.client.post(url, data_invalid, format="multipart")
        self.assertEqual(bad_res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("photo", bad_res.data)

    def test_repeated_confirmations_prevented_and_threshold(self):
        """Criterion 15: Repeated confirmations from same account are prevented, and 3 confirms auto-transition status."""
        self.client.force_authenticate(user=self.user)
        url = reverse("hazard-confirm", kwargs={"pk": self.report.pk})

        # First confirmation
        res1 = self.client.post(url)
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertEqual(res1.data["confirmations_count"], 1)

        # Duplicate confirmation by same user rejected
        res_dup = self.client.post(url)
        self.assertEqual(res_dup.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already confirmed", res_dup.data["detail"])

        # Another user confirms (count = 2)
        self.client.force_authenticate(user=self.other_user)
        res2 = self.client.post(url)
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertEqual(res2.data["confirmations_count"], 2)

        # Third user confirms -> status transitions to community_confirmed
        third_user = User.objects.create_user(username="thirduser", password="StrongPassword123!")
        self.client.force_authenticate(user=third_user)
        res3 = self.client.post(url)
        self.assertEqual(res3.status_code, status.HTTP_200_OK)
        self.assertEqual(res3.data["confirmations_count"], 3)
        self.assertEqual(res3.data["status"], "community_confirmed")

    def test_report_filtering_and_viewport_bounds(self):
        """Criterion 16: Report filtering and viewport bounds (min/max and bbox) work correctly."""
        url = reverse("hazard-list")

        # Category filter
        res_cat = self.client.get(url, {"category": "flooding"})
        self.assertEqual(res_cat.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_cat.data["results"]), 1)
        self.assertEqual(res_cat.data["results"][0]["category"], "flooding")

        # Individual min_lat, max_lat, min_lng, max_lng filter
        res_bounds = self.client.get(url, {
            "min_lat": "6.4000",
            "max_lat": "6.5000",
            "min_lng": "3.3000",
            "max_lng": "3.4500",
        })
        self.assertEqual(res_bounds.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_bounds.data["results"]), 1)

        # Bbox filter format: west,south,east,north
        res_bbox = self.client.get(url, {
            "bbox": "3.3000,6.4000,3.4500,6.5000",
        })
        self.assertEqual(res_bbox.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_bbox.data["results"]), 1)

        # Out-of-bounds bbox
        res_bbox_out = self.client.get(url, {
            "bbox": "7.0000,9.0000,7.1000,9.1000",
        })
        self.assertEqual(res_bbox_out.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_bbox_out.data["results"]), 0)

    def test_demo_records_distinguishable(self):
        """Criterion 18: Demo records are clearly distinguishable from real records."""
        url = reverse("hazard-list")
        res_demo = self.client.get(url, {"demo": "true"})
        self.assertEqual(res_demo.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_demo.data["results"]), 1)
        self.assertTrue(res_demo.data["results"][0]["is_demo"])

        res_real = self.client.get(url, {"demo": "false"})
        self.assertEqual(res_real.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_real.data["results"]), 1)
        self.assertFalse(res_real.data["results"][0]["is_demo"])

    def test_flag_hazard_authenticated(self):
        """Test submitting a flag on a report."""
        self.client.force_authenticate(user=self.user)
        url = reverse("hazard-flag", kwargs={"pk": self.report.pk})
        payload = {
            "reason": "cleared",
            "notes": "The water has receded completely.",
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(HazardFlag.objects.filter(report=self.report).count(), 1)
        self.report.refresh_from_db()
        self.assertEqual(self.report.flags_count, 1)

        # Duplicate pending flag rejected
        dup_res = self.client.post(url, payload, format="json")
        self.assertEqual(dup_res.status_code, status.HTTP_400_BAD_REQUEST)
