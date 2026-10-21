"""
Django settings for RouteX project.
Team: NextGen | Product: RouteX
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import dj_database_url

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BASE_DIR.parent

# Ensure apps directory is on sys.path
APPS_DIR = BASE_DIR / "apps"
if str(APPS_DIR) not in sys.path:
    sys.path.insert(0, str(APPS_DIR))
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# Load environment variables from repo root .env first, then backend .env if present
root_env = REPO_ROOT / ".env"
backend_env = BASE_DIR / ".env"
if root_env.exists():
    load_dotenv(root_env)
elif backend_env.exists():
    load_dotenv(backend_env)
else:
    load_dotenv()

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/

SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "routex-dev-insecure-key-3b49f9e8a01cd4208a032d847a951c82",
)

DEBUG = os.environ.get("DJANGO_DEBUG", "True").lower() in ("true", "1", "yes")

allowed_hosts_raw = os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1,[::1]")
ALLOWED_HOSTS = [host.strip() for host in allowed_hosts_raw.split(",") if host.strip()]
if DEBUG:
    # Allow local network devices and test server during development
    for dev_host in ["testserver", "*"]:
        if dev_host not in ALLOWED_HOSTS:
            ALLOWED_HOSTS.append(dev_host)

# Application definition
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "corsheaders",
    "drf_spectacular",
    "cloudinary_storage",
    "cloudinary",
    # RouteX domain apps
    "apps.common.apps.CommonConfig",
    "apps.accounts.apps.AccountsConfig",
    "apps.hazards.apps.HazardsConfig",
    "apps.moderation.apps.ModerationConfig",
    "apps.ai_assistant.apps.AiAssistantConfig",
    "apps.notifications.apps.NotificationsConfig",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# Database configuration
# Supports PostgreSQL via environment variables, with safe SQLite fallback for local development
database_url = os.environ.get("DATABASE_URL")
use_postgres = os.environ.get("USE_POSTGRES", "False").lower() in ("true", "1", "yes")

if database_url:
    DATABASES = {
        "default": dj_database_url.config(
            default=database_url,
            conn_max_age=600,
            conn_health_checks=True,
            ssl_require=True,
        )
    }
elif use_postgres:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.environ.get("DB_NAME", "routex_db"),
            "USER": os.environ.get("DB_USER", "routex_user"),
            "PASSWORD": os.environ.get("DB_PASSWORD", ""),
            "HOST": os.environ.get("DB_HOST", "localhost"),
            "PORT": os.environ.get("DB_PORT", "5432"),
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

if "test" in sys.argv:
    PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
    EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"


# Internationalization
LANGUAGE_CODE = "en-gb"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# Media files (User uploads such as hazard photos)
MEDIA_URL = os.environ.get("MEDIA_URL", "/media/")
MEDIA_ROOT = BASE_DIR / "media"
MAX_UPLOAD_SIZE_MB = int(os.environ.get("MAX_UPLOAD_SIZE_MB", 5))

# Cloudinary Storage Configuration
# When CLOUDINARY_URL is configured (and not running unit tests), use Cloudinary for media storage
CLOUDINARY_CONFIGURED = bool(os.environ.get("CLOUDINARY_URL"))
if CLOUDINARY_CONFIGURED and "test" not in sys.argv:
    CLOUDINARY_STORAGE = {
        "PREFIX": "routex_media/",
        "MEDIA_TAG": "routex_media",
    }
    STORAGES = {
        "default": {
            "BACKEND": "cloudinary_storage.storage.MediaCloudinaryStorage",
        },
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
        },
    }
    DEFAULT_FILE_STORAGE = "cloudinary_storage.storage.MediaCloudinaryStorage"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Django REST Framework
REST_FRAMEWORK = {
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ],
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "apps.accounts.authentication.RouteXSessionAuthentication",
        "rest_framework.authentication.BasicAuthentication",
    ],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
        "rest_framework.parsers.FormParser",
        "rest_framework.parsers.MultiPartParser",
    ],
}

# Swagger / OpenAPI Documentation Settings
SPECTACULAR_SETTINGS = {
    "TITLE": "RouteX API",
    "DESCRIPTION": (
        "RouteX is a community-powered road-hazard reporting platform.\n\n"
        "Features:\n"
        "- Browse community reported hazards (flooding, potholes, blocked roads, fallen trees)\n"
        "- Submit new road hazard reports with coordinates and optional photo evidence\n"
        "- Confirm that a hazard remains present\n"
        "- Flag inaccurate or resolved reports for moderator review\n"
        "- Geographic bounding box and status/category filtering"
    ),
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
    "CONTACT": {
        "name": "Team NextGen - RouteX",
    },
    "TAGS": [
        {"name": "hazards", "description": "Browse, submit, confirm, and flag community road hazards."},
        {"name": "auth", "description": "Session authentication, registration, user profile, and personal citizen dashboard."},
        {"name": "moderation", "description": "Moderator queue, report inspection, status transitions with mandatory rationale, and decision history."},
        {"name": "admin", "description": "Platform administration, user & role management, operational settings, and system audit trail."},
        {"name": "ai", "description": "Google Gemini-powered AI assistants for category suggestion, wording improvement, report summarization, and duplicate detection."},
        {"name": "system", "description": "System health and discovery endpoints."},
    ],
}

# CORS and CSRF
cors_raw = os.environ.get("CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000")
CORS_ALLOWED_ORIGINS = [origin.strip() for origin in cors_raw.split(",") if origin.strip()]
CORS_ALLOW_CREDENTIALS = True

csrf_raw = os.environ.get("CSRF_TRUSTED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8000,http://127.0.0.1:8000")
CSRF_TRUSTED_ORIGINS = [origin.strip() for origin in csrf_raw.split(",") if origin.strip()]

# In development (DEBUG=True), allow LAN/local Wi-Fi origins (e.g. 192.168.x.x, 10.x.x.x, 172.x.x.x) for phone/tablet testing
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
    # Auto-trust local network IPs for CSRF checking
    for proto in ("http://", "https://"):
        for port in (":5173", ":8000", ":3000", ""):
            # Common private LAN subnets
            for prefix in ("192.168.", "10.", "172.16.", "172.17.", "172.18.", "172.19.", "172.20.", "172.21.", "172.22.", "172.23.", "172.24.", "172.25.", "172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31."):
                # Add wildcard pattern supported in Django 4+
                CSRF_TRUSTED_ORIGINS.append(f"{proto}*.{prefix.rstrip('.')}*")
    
    # Also explicitly add standard local patterns
    CSRF_TRUSTED_ORIGINS.extend([
        "http://*.192.168.*",
        "http://192.168.*",
        "http://*.local",
        "http://*.local:5173",
        "http://*.local:8000",
    ])
    # Extract any specific device IP if defined in environment or add regex/common LAN origins
    lan_ip = os.environ.get("LAN_IP", "").strip()
    if lan_ip:
        CSRF_TRUSTED_ORIGINS.extend([
            f"http://{lan_ip}:5173",
            f"http://{lan_ip}:8000",
        ])
    # Ensure all entries are unique
    CSRF_TRUSTED_ORIGINS = list(dict.fromkeys(CSRF_TRUSTED_ORIGINS))

# Google Gemini AI Feature Settings (Backend-only, strictly optional)
GEMINI_AI_ENABLED = os.environ.get("GEMINI_AI_ENABLED", "False").lower() in ("true", "1", "yes")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
ROUTEX_AI_MAX_INPUT_CHARS = int(os.environ.get("ROUTEX_AI_MAX_INPUT_CHARS", "3000"))
ROUTEX_AI_TIMEOUT_SECONDS = int(os.environ.get("ROUTEX_AI_TIMEOUT_SECONDS", "10"))

# Email API Configuration (Imported from .env)
EMAIL_BACKEND = (
    "django.core.mail.backends.locmem.EmailBackend"
    if "test" in sys.argv
    else os.environ.get(
        "EMAIL_BACKEND",
        "django.core.mail.backends.console.EmailBackend" if DEBUG else "django.core.mail.backends.smtp.EmailBackend",
    )
)
EMAIL_HOST = os.environ.get("EMAIL_HOST", "smtp-relay.brevo.com")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", 587))
EMAIL_USE_TLS = os.environ.get("EMAIL_USE_TLS", "True").lower() in ("true", "1", "yes")
EMAIL_USE_SSL = os.environ.get("EMAIL_USE_SSL", "False").lower() in ("true", "1", "yes")
EMAIL_TIMEOUT = int(os.environ.get("EMAIL_TIMEOUT", 30))
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", EMAIL_HOST_USER or "noreply@routex.org")
SERVER_EMAIL = DEFAULT_FROM_EMAIL

# Frontend Application URL & Password Reset Settings
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173").rstrip("/")
TEST_RESET_EMAIL = os.environ.get("TEST_RESET_EMAIL", "")
PASSWORD_RESET_TIMEOUT = int(os.environ.get("PASSWORD_RESET_TIMEOUT", 86400))  # 24 hours in seconds
