"""
RouteX Administration URL Configuration
All administrative endpoints under /api/v1/admin/
"""
from django.urls import path
from . import views_admin

urlpatterns = [
    path("stats/", views_admin.admin_stats_view, name="admin-stats"),
    path("users/", views_admin.admin_users_list_view, name="admin-users-list"),
    path("users/<int:user_id>/", views_admin.admin_user_delete_view, name="admin-user-delete"),
    path("users/<int:user_id>/role/", views_admin.admin_user_role_update_view, name="admin-user-role-update"),
    path("settings/", views_admin.admin_settings_view, name="admin-settings"),
    path("audit-logs/", views_admin.admin_audit_logs_view, name="admin-audit-logs"),
]
