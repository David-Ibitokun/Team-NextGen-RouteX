from django.contrib.auth.models import User
from django.contrib.sessions.models import Session
from django.contrib.sessions.backends.db import SessionStore
from django.utils import timezone
from rest_framework.authentication import SessionAuthentication

class RouteXSessionAuthentication(SessionAuthentication):
    """
    Dual-mode session authentication for RouteX:
    1. Checks for 'X-Session-ID' or 'Authorization: Session/Bearer <session_key>' header.
       This provides rock-solid mobile authentication across Android, iOS, and WebViews
       without cookie jar restrictions or cross-origin cookie drops.
    2. Falls back to standard Django session cookie authentication.
    """
    def authenticate(self, request):
        session_key = request.headers.get("X-Session-ID")
        if not session_key:
            auth_header = request.headers.get("Authorization", "").strip()
            if auth_header.startswith("Bearer "):
                session_key = auth_header[7:].strip()
            elif auth_header.startswith("Session "):
                session_key = auth_header[8:].strip()

        if session_key:
            try:
                session_obj = Session.objects.filter(
                    session_key=session_key,
                    expire_date__gt=timezone.now()
                ).first()
                if session_obj:
                    session_data = session_obj.get_decoded()
                    user_id = session_data.get("_auth_user_id")
                    if user_id:
                        user = User.objects.select_related("profile").get(pk=user_id)
                        if user.is_active:
                            request.session = SessionStore(session_key=session_key)
                            return (user, None)
            except Exception:
                pass

        # Fallback to standard cookie session
        return super().authenticate(request)

    def enforce_csrf(self, request):
        # Header-based sessions are inherently immune to CSRF browser attacks
        if request.headers.get("X-Session-ID") or request.headers.get("Authorization"):
            return
        return super().enforce_csrf(request)
