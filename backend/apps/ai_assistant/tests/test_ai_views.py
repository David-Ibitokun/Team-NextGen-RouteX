"""
API integration tests for RouteX AI Assistant endpoints
"""

import json
from unittest.mock import patch, MagicMock
from django.test import TestCase, override_settings
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status

from apps.hazards.models import HazardReport, HazardCategory


class AiAssistantViewsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="citizen_jane",
            email="jane@example.com",
            password="StrongPassword123!",
        )

    def test_unauthenticated_request_rejected(self):
        response = self.client.post(
            "/api/v1/ai/suggest-category/",
            {"description": "Flooding at roundabout"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @override_settings(GEMINI_AI_ENABLED=False)
    def test_disabled_ai_returns_503(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/v1/ai/suggest-category/",
            {"description": "Flooding at roundabout"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        data = response.json()
        self.assertIn("error", data)
        self.assertEqual(data.get("code"), "ai_unavailable")

    @override_settings(GEMINI_AI_ENABLED=True, GEMINI_API_KEY="test-key")
    def test_validation_error_on_short_description(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/v1/ai/suggest-category/",
            {"description": "bad"},  # < 5 chars
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @override_settings(GEMINI_AI_ENABLED=True, GEMINI_API_KEY="test-key")
    @patch("apps.ai_assistant.services.requests.post")
    def test_suggest_category_api_success(self, mock_post):
        self.client.force_authenticate(user=self.user)

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "text": json.dumps({
                                    "suggested_category": "pothole",
                                    "confidence": 0.9,
                                    "reason": "Mentions broken tarmac and wheel damage",
                                })
                            }
                        ]
                    }
                }
            ]
        }
        mock_post.return_value = mock_resp

        response = self.client.post(
            "/api/v1/ai/suggest-category/",
            {"description": "Huge pothole cracked my alloy wheel"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["suggested_category"], "pothole")
        self.assertIn("confidence", data)
        self.assertIn("disclaimer", data)

    @override_settings(GEMINI_AI_ENABLED=True, GEMINI_API_KEY="test-key")
    @patch("apps.ai_assistant.services.requests.post")
    def test_improve_description_api_success(self, mock_post):
        self.client.force_authenticate(user=self.user)

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "text": json.dumps({
                                    "suggested_description": "A tree fell across both lanes blocking traffic.",
                                    "changes_made": "Fixed grammar and clarified lane obstruction.",
                                })
                            }
                        ]
                    }
                }
            ]
        }
        mock_post.return_value = mock_resp

        response = self.client.post(
            "/api/v1/ai/improve-description/",
            {"description": "tree fall on road blocking all car"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["suggested_description"], "A tree fell across both lanes blocking traffic.")
        self.assertIn("changes_made", data)

    @override_settings(GEMINI_AI_ENABLED=True, GEMINI_API_KEY="test-key")
    def test_summarize_report_not_found(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/v1/ai/summarise-report/",
            {"report_id": 999999},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    @override_settings(GEMINI_AI_ENABLED=True, GEMINI_API_KEY="test-key")
    @patch("apps.ai_assistant.services.requests.post")
    def test_summarize_report_api_success(self, mock_post):
        self.client.force_authenticate(user=self.user)

        report = HazardReport.objects.create(
            category=HazardCategory.BLOCKED_ROAD,
            location_label="Lekki Toll Gate",
            description="Broken container truck occupying 3 lanes heading towards VI.",
            latitude=6.4350,
            longitude=3.4600,
            reporter=self.user,
        )

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "text": json.dumps({
                                    "summary": "Container truck breakdown blocking 3 lanes at Lekki Toll Gate.",
                                    "urgency_level": "high",
                                })
                            }
                        ]
                    }
                }
            ]
        }
        mock_post.return_value = mock_resp

        response = self.client.post(
            "/api/v1/ai/summarise-report/",
            {"report_id": report.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["report_id"], report.id)
        self.assertIn("Lekki Toll Gate", data["summary"])

    @override_settings(GEMINI_AI_ENABLED=True, GEMINI_API_KEY="test-key")
    def test_check_duplicates_api_zero_candidates(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/v1/ai/check-duplicates/",
            {
                "latitude": 6.5000,
                "longitude": 3.3500,
                "description": "Flooding along service lane",
                "radius_km": 1.0,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertFalse(data["is_possible_duplicate"])
        self.assertEqual(data["nearby_count"], 0)
        self.assertEqual(len(data["candidates"]), 0)
