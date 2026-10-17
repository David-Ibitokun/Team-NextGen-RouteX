from django.urls import path
from . import views

urlpatterns = [
    path("stats/", views.moderation_stats_view, name="moderation-stats"),
    path("history/", views.moderation_all_history_view, name="moderation-all-history"),
    path("reports/", views.moderation_reports_list, name="moderation-reports-list"),
    path("reports/<int:pk>/action/", views.moderation_report_action, name="moderation-report-action"),
    path("reports/<int:pk>/actions/", views.moderation_report_history, name="moderation-report-history"),
    # Hazard route aliases
    path("hazards/", views.moderation_reports_list, name="moderation-hazards-list"),
    path("hazards/<int:pk>/action/", views.moderation_report_action, name="moderation-hazard-action"),
    path("hazards/<int:pk>/actions/", views.moderation_report_history, name="moderation-hazard-history"),
]
