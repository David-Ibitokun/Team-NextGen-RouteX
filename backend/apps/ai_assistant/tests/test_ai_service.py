"""
Unit tests for RouteX GeminiService
"""

import json
from unittest.mock import patch, MagicMock
from django.test import TestCase, override_settings
from django.contrib.auth.models import User
import requests

from apps.hazards.models import HazardReport, HazardCategory, HazardStatus
from apps.ai_assistant.services import (
    GeminiService,
    haversine_distance,
    AiServiceUnavailableError,
    AiTimeoutError,
    AiQuotaExceededError,
    AiInvalidOutputError,
)


class GeminiServiceTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testcitizen", password="password123")

    @override_settings(GEMINI_AI_ENABLED=False)
    def test_is_available_when_disabled(self):
        ok, reason = GeminiService.is_available()
        self.assertFalse(ok)
        self.assertIn("disabled", reason)

    @override_settings(GEMINI_AI_ENABLED=True, GEMINI_API_KEY="")
    def test_is_available_when_key_missing(self):
        ok, reason = GeminiService.is_available()
        self.assertFalse(ok)
        self.assertIn("not configured", reason)

    @override_settings(GEMINI_AI_ENABLED=True, GEMINI_API_KEY="valid-test-key")
    def test_is_available_when_configured(self):
        ok, reason = GeminiService.is_available()
        self.assertTrue(ok)
        self.assertEqual(reason, "")

    def test_haversine_distance(self):
        # Distance from Lagos Marina (6.4531, 3.3958) to Ikoyi (6.4500, 3.4300) is approx ~3.78 km
        dist = haversine_distance(6.4531, 3.3958, 6.4500, 3.4300)
        self.assertAlmostEqual(dist, 3.8, delta=0.5)

        # Distance to exact same point is 0
        self.assertEqual(haversine_distance(6.45, 3.39, 6.45, 3.39), 0.0)

    @override_settings(GEMINI_AI_ENABLED=True, GEMINI_API_KEY="test-key")
    @patch("apps.ai_assistant.services.requests.post")
    def test_suggest_category_success(self, mock_post):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "text": json.dumps({
                                    "suggested_category": "flooding",
                                    "confidence": 0.95,
                                    "reason": "Water is covering the entire roadway.",
                                })
                            }
                        ]
                    }
                }
            ]
        }
        mock_post.return_value = mock_response

        result = GeminiService.suggest_category("Huge water flood on road")
        self.assertEqual(result["suggested_category"], "flooding")
        self.assertEqual(result["category_display"], "Flooding / Standing Water")
        self.assertEqual(result["confidence"], 0.95)
        self.assertIn("disclaimer", result)

    @override_settings(GEMINI_AI_ENABLED=True, GEMINI_API_KEY="test-key")
    @patch("apps.ai_assistant.services.requests.post")
    def test_suggest_category_fallback_on_invalid_enum(self, mock_post):
        # Model returns an unsupported category
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "text": json.dumps({
                                    "suggested_category": "volcano_eruption",
                                    "confidence": 0.8,
                                    "reason": "Unusual event",
                                })
                            }
                        ]
                    }
                }
            ]
        }
        mock_post.return_value = mock_response

        result = GeminiService.suggest_category("Lava flow across street")
        # Must safely fallback to 'other'
        self.assertEqual(result["suggested_category"], "other")

    @override_settings(GEMINI_AI_ENABLED=True, GEMINI_API_KEY="test-key")
    @patch("apps.ai_assistant.services.requests.post")
    def test_improve_description_success(self, mock_post):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "text": json.dumps({
                                    "suggested_description": "Water covers both lanes, making vehicle passage difficult.",
                                    "changes_made": "Fixed grammar and spelling.",
                                })
                            }
                        ]
                    }
                }
            ]
        }
        mock_post.return_value = mock_response

        result = GeminiService.improve_description("water cover road cars cant pass")
        self.assertEqual(result["original_description"], "water cover road cars cant pass")
        self.assertEqual(result["suggested_description"], "Water covers both lanes, making vehicle passage difficult.")
        self.assertIn("disclaimer", result)

    @override_settings(GEMINI_AI_ENABLED=True, GEMINI_API_KEY="test-key")
    @patch("apps.ai_assistant.services.requests.post")
    def test_summarize_report_success(self, mock_post):
        report = HazardReport.objects.create(
            category=HazardCategory.FLOODING,
            location_label="Marina Underpass",
            description="Deep water accumulation due to blocked storm drain.",
            latitude=6.4531,
            longitude=3.3958,
            reporter=self.user,
        )

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "text": json.dumps({
                                    "summary": "Reported flooding at Marina Underpass with standing water.",
                                    "urgency_level": "high",
                                })
                            }
                        ]
                    }
                }
            ]
        }
        mock_post.return_value = mock_response

        result = GeminiService.summarize_report(report)
        self.assertEqual(result["report_id"], report.id)
        self.assertEqual(result["category"], "flooding")
        self.assertEqual(result["urgency_level"], "high")
        self.assertIn("Marina Underpass", result["summary"])

    @override_settings(GEMINI_AI_ENABLED=True, GEMINI_API_KEY="test-key")
    @patch("apps.ai_assistant.services.requests.post")
    def test_check_duplicates_zero_nearby_skips_ai(self, mock_post):
        # When 0 reports exist nearby, requests.post should NEVER be called
        result = GeminiService.check_duplicates(
            latitude=6.5000,
            longitude=3.3500,
            description="Large pothole near market",
            radius_km=1.0,
        )
        self.assertFalse(result["is_possible_duplicate"])
        self.assertEqual(result["nearby_count"], 0)
        self.assertEqual(len(result["candidates"]), 0)
        mock_post.assert_not_called()

    @override_settings(GEMINI_AI_ENABLED=True, GEMINI_API_KEY="test-key")
    @patch("apps.ai_assistant.services.requests.post")
    def test_check_duplicates_with_nearby_candidate(self, mock_post):
        existing = HazardReport.objects.create(
            category=HazardCategory.POTHOLE,
            location_label="Broad Street",
            description="Huge crater destroying car suspensions",
            latitude=6.4530,
            longitude=3.3950,
            reporter=self.user,
        )

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "text": json.dumps({
                                    "is_possible_duplicate": True,
                                    "analysis": "Both reports cite severe road crater at Broad Street.",
                                    "matches": [
                                        {
                                            "candidate_id": existing.id,
                                            "similarity_score": 0.92,
                                            "is_likely_same": True,
                                            "rationale": "Same location and identical pothole issue.",
                                        }
                                    ],
                                })
                            }
                        ]
                    }
                }
            ]
        }
        mock_post.return_value = mock_response

        result = GeminiService.check_duplicates(
            latitude=6.4531,
            longitude=3.3951,
            description="Deep pothole in middle of lane on Broad Street",
            radius_km=0.5,
        )
        self.assertTrue(result["is_possible_duplicate"])
        self.assertEqual(result["nearby_count"], 1)
        self.assertEqual(len(result["candidates"]), 1)
        self.assertEqual(result["candidates"][0]["id"], existing.id)
        self.assertTrue(result["candidates"][0]["is_likely_same_hazard"])
        mock_post.assert_called_once()

    @override_settings(GEMINI_AI_ENABLED=True, GEMINI_API_KEY="test-key")
    @patch("apps.ai_assistant.services.requests.post")
    def test_timeout_handling(self, mock_post):
        mock_post.side_effect = requests.exceptions.Timeout("Connection timed out")
        with self.assertRaises(AiTimeoutError):
            GeminiService.call_gemini("test prompt")
