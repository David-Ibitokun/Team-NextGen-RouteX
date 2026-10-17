"""
RouteX Accounts URL Configuration
All auth endpoints under /api/v1/auth/
"""
from django.urls import path
from . import views

urlpatterns = [
    path("csrf/", views.csrf_token_view, name="auth-csrf"),
    path("register/", views.register_view, name="auth-register"),
    path("login/", views.login_view, name="auth-login"),
    path("logout/", views.logout_view, name="auth-logout"),
    path("me/", views.me_view, name="auth-me"),
    path("me/reports/", views.my_reports_view, name="auth-my-reports"),
    path("dashboard-summary/", views.dashboard_summary_view, name="auth-dashboard-summary"),
    path("profile/", views.profile_update_view, name="auth-profile-update"),
]
