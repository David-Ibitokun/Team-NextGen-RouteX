"""
RouteX Role-Based Access Control (RBAC) Permissions
Enforces backend security across the four user access levels:
1. Anonymous Visitor: Handled by AllowAny.
2. Registered User (Citizen): Handled by IsCitizen / IsAuthenticated.
3. Moderator: Handled by IsModeratorUser.
4. Administrator: Handled by IsPlatformAdmin.
"""
from rest_framework.permissions import BasePermission

class IsCitizen(BasePermission):
    """
    Allows access to any authenticated registered user (Citizen, Moderator, or Admin).
    Denies anonymous visitors.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)


class IsModeratorUser(BasePermission):
    """
    Allows access to trusted moderators and administrators.
    Checks Django staff/superuser flags as well as profile.role.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_superuser or request.user.is_staff:
            return True
        try:
            return request.user.profile.role in ["moderator", "admin"]
        except Exception:
            return False


class IsPlatformAdmin(BasePermission):
    """
    Allows access strictly to platform administrators (or Django superusers).
    Regular citizens and moderators are denied with 403 Forbidden.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_superuser:
            return True
        try:
            return request.user.profile.role == "admin"
        except Exception:
            return False
