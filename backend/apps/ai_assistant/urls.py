"""
URL routing for RouteX AI Assistant endpoints
"""

from django.urls import path
from .views import (
    SuggestCategoryView,
    ImproveDescriptionView,
    SummarizeReportView,
    CheckDuplicatesView,
)

app_name = "ai_assistant"

urlpatterns = [
    path("suggest-category/", SuggestCategoryView.as_view(), name="suggest-category"),
    path("improve-description/", ImproveDescriptionView.as_view(), name="improve-description"),
    path("summarise-report/", SummarizeReportView.as_view(), name="summarise-report"),
    path("check-duplicates/", CheckDuplicatesView.as_view(), name="check-duplicates"),
]
