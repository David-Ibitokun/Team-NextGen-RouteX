# RouteX

<div align="center">

### Know the Road Ahead.
**Community-Powered Road Hazard Reporting and Awareness Platform**

**Team:** NextGen &nbsp;|&nbsp; **Scope:** Universal Community Road Awareness &nbsp;|&nbsp; **Version:** 1.0.0-MVP

[![Django Tests](https://img.shields.io/badge/Django_Tests-68%2F68_Passing-brightgreen.svg)]()
[![Mobile Tests](https://img.shields.io/badge/Mobile_Tests-15%2F15_Passing-brightgreen.svg)]()
[![OpenAPI 3.0](https://img.shields.io/badge/OpenAPI-3.0_Swagger_UI-blue.svg)](http://127.0.0.1:8000/api/docs/)
[![AI Ready](https://img.shields.io/badge/Gemini_AI-Integrated-orange.svg)]()
[![Notifications](https://img.shields.io/badge/Notifications-Full_Stack-teal.svg)]()
[![Frontend Build](https://img.shields.io/badge/Vite_Build-Passing-brightgreen.svg)]()
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-purple.svg)]()
[![Icons](https://img.shields.io/badge/Icons-Lucide_React-teal.svg)](https://lucide.dev/)

</div>

---

## Table of Contents
- [Project Overview](#-project-overview)
- [Four Account Types & Permissions Model](#-four-account-types--permissions-model)
- [Three Dedicated Dashboards](#-three-dedicated-dashboards)
- [Progressive Web App (PWA) Support](#-progressive-web-app-pwa-support)
- [Quick Start (One-Click .bat)](#-quick-start-one-click-bat)
- [Application Pages & User Experiences](#-application-pages--user-experiences)
- [System Architecture](#-system-architecture)
- [Swagger UI & API Documentation](#-swagger-ui--api-documentation)
- [Environment Configuration (.env)](#-environment-configuration-env)
- [Manual Setup & Running](#-manual-setup--running)
- [Testing & Quality Assurance (68/68 Tests Passing)](#-testing--quality-assurance)
- [Repository Structure](#-repository-structure)
- [Detailed Documentation](#-detailed-documentation)
- [Trust Rules & Civic Ethics](#-trust-rules--civic-ethics)

---


---

## 🌐 Live Deployments & Demo Links

- **Production Web Application (Vercel):** [https://team-next-gen-route-x.vercel.app/](https://team-next-gen-route-x.vercel.app/)
- **Live Interactive Map:** [https://team-next-gen-route-x.vercel.app/map](https://team-next-gen-route-x.vercel.app/map)
- **Live Backend API (Heroku):** [https://routex-api-bcfe83a1907c.herokuapp.com/api/v1/](https://routex-api-bcfe83a1907c.herokuapp.com/api/v1/)
- **Android .APK & Video Demo (Google Drive):** [https://drive.google.com/drive/folders/1tqXxSZzJE3oaAh6K4xVrZiiW3czJdI21](https://drive.google.com/drive/folders/1tqXxSZzJE3oaAh6K4xVrZiiW3czJdI21)
- **Interactive Pitch Deck:** [slides.html](slides.html)

## 🌍 Project Overview

**RouteX** is a civic-tech road hazard reporting and awareness application built by team **NextGen**. It empowers commuters, drivers, cyclists, and local residents to discover ground-level road hazards and share timely, actionable updates.

Unlike closed or proprietary navigation systems, RouteX operates on **civic transparency and crowdsourcing**:
- **Universal Scope:** Coordinate-based geospatial architecture operates universally across any city, region, or commute corridor.
- **Strict Role-Based Security:** Four account types (Anonymous Visitor, Registered Citizen, Moderator, Administrator) enforced on the backend by Django REST Framework permission classes.
- **Three Custom Frontend Dashboards:** Separate dedicated pages for Citizens, Moderators, and Administrators (custom-built frontend connected via REST APIs, with zero reliance on Django's built-in admin dashboard).
- **Native-Like Progressive Web App (PWA):** Installable on Android, iOS, Windows, and macOS with offline shell caching, low bandwidth usage, and instant home screen launch.

---

## 👥 Four Account Types & Permissions Model

| Feature / Capability | Anonymous Visitor | Registered Citizen | Moderator | Administrator |
|---|:---:|:---:|:---:|:---:|
| Browse Landing Page & Live Map | ✅ | ✅ | ✅ | ✅ |
| Filter Hazards & View Detail Panel | ✅ | ✅ | ✅ | ✅ |
| Filter Hazards by 10km Proximity ("Near Me") | ✅ | ✅ | ✅ | ✅ |
| Submit Road Hazard Report | ❌ | ✅ | ✅ | ✅ |
| Upload Photographic Evidence | ❌ | ✅ | ✅ | ✅ |
| Confirm Active Hazard (1 per user) | ❌ | ✅ | ✅ | ✅ |
| AI Category Suggestion & Wording Enhancer | ❌ | ✅ | ✅ | ✅ |
| AI Proactive Duplicate Detection & 1-Click Confirm | ❌ | ✅ | ✅ | ✅ |
| In-App & Push Notifications Inbox | ❌ | ✅ | ✅ | ✅ |
| Submit Report Flag for Review | ❌ | ✅ | ✅ | ✅ |
| Access Citizen Dashboard (`/dashboard`) | ❌ | ✅ | ✅ | ✅ |
| Access Moderator Queue (`/moderator`) | ❌ | ❌ | ✅ | ✅ |
| Perform Moderation Action with Reason | ❌ | ❌ | ✅ | ✅ |
| AI Incident Summarizer for Moderators | ❌ | ❌ | ✅ | ✅ |
| Broadcast Corridor Safety Advisories | ❌ | ❌ | ✅ | ✅ |
| Access Admin Portal (`/admin-dashboard`) | ❌ | ❌ | ❌ | ✅ |
| Manage User Roles (Promote/Demote) | ❌ | ❌ | ❌ | ✅ |
| Configure Live Operational Parameters | ❌ | ❌ | ❌ | ✅ |
| Inspect System-Wide Audit Logs | ❌ | ❌ | ❌ | ✅ |

### Server-Enforced Registration Rules:
1. Public registration (`POST /api/v1/auth/register/`) always assigns `role="citizen"`.
2. Administrative promotions to `moderator` or `admin` are only possible through the protected Admin API (`PATCH /api/v1/admin/users/{id}/role/`).
3. Self-demotion safeguards prevent administrators from accidentally stripping their own privileges.

---

## 📊 Three Dedicated Dashboards

### 1. Citizen Commuter Dashboard (`/dashboard` & `/my-reports`)
- **Personal Metrics:** Total Submissions, Confirmations Received, Active Alerts, Cleared Hazards.
- **My Submissions:** Status filters (*All*, *Reported*, *Confirmed*, *Resolved*), freshness badges, confirmation counts, and direct map links.
- **Community Impact:** Citizen observer badges, verification rate, and road safety guidelines.
- **Profile Settings:** Inline editor for display name and email address.

### 2. Moderator Trust & Safety Queue (`/moderator` & `/moderation`)
- **Queue Overview:** Flagged hazard reports sorted by priority, pending inspections, and active hazards.
- **Action Modal:** Fast one-click decisions (*Confirm Hazard*, *Mark Under Review*, *Mark Resolved*, *Reject / Dismiss*) with mandatory justification rationale.
- **Decision History:** Chronological log of moderation decisions recorded across the entire platform.

### 3. Platform Administrator Portal (`/admin-dashboard` & `/admin`)
- **Custom-Built Frontend UI:** Connected via `/api/v1/admin/` endpoints (no Django built-in admin dashboard).
- **User & Role Management:** Search users by username or email, filter by role, and promote/demote accounts with audit logging.
- **Live Operational Settings:** Form to configure confirmation auto-threshold (1–20), report freshness window (1–168 hours), and max upload size (1–25 MB).
- **System Audit Trail:** Chronological record of administrative events and system parameter changes.

### 4. Data Privacy, Transparency & User Rights (`/privacy`)
- **No Background Tracking:** Foreground GPS queried on-demand only for proximity radius checks; zero background tracking.
- **Client-Side EXIF Scrubbing:** Camera model and GPS metadata are automatically stripped during WebP compression before upload.
- **Zero-PII AI Boundary:** Google Gemini processes only raw hazard text; no personal account data is ever transmitted.
- **Self-Service Erasure:** Permanent account deletion (`POST /api/v1/auth/delete-account/`) with anonymized hazard preservation (`on_delete=models.SET_NULL`).

---

## 📱 Progressive Web App (PWA) Support

RouteX is fully installable as a native-like desktop and mobile application:
- **Web App Manifest (`manifest.json`):** Configures standalone display mode, high-res maskable SVG icons, theme colors (`#142B3B` and `#087F8C`), and app shortcuts.
- **Service Worker (`sw.js`):** Pre-caches the app shell, applies network-first navigation with offline fallback, and uses stale-while-revalidate for static assets.
- **Install Prompt UI:** Detects `beforeinstallprompt` and surfaces one-click install buttons in the header, mobile drawer, and landing page.

---

## 🚀 Quick Start (One-Click .bat)

On Windows, you can start the entire application suite with a single click:

| Command / Script | What it Does |
|---|---|
| [`run_all.bat`](file:///c:/Users/ibito/Documents/GitHub/RouteX/run_all.bat) | **Launches both Backend and Frontend** in two separate command windows and opens their respective endpoints. |
| [`run_backend.bat`](file:///c:/Users/ibito/Documents/GitHub/RouteX/run_backend.bat) | Activates virtualenv, applies migrations, seeds accounts & hazards via `seed_db.py`, and starts Django on `http://127.0.0.1:8000/`. |
| [`run_frontend.bat`](file:///c:/Users/ibito/Documents/GitHub/RouteX/run_frontend.bat) | Checks dependencies and starts the Vite development server on `http://localhost:5173/`. |
| [`test_backend.bat`](file:///c:/Users/ibito/Documents/GitHub/RouteX/test_backend.bat) | Runs the comprehensive 68-test Django backend test suite with verbose reporting. |

---

## 🔑 Seeded Demo Accounts & Login Credentials

The database can be instantly seeded at any time using either Python or pure SQL:
- **Python Seeder:** `python seed_db.py`
- **Raw SQL Dump:** `sqlite3 backend/db.sqlite3 < seed_db.sql`

| Role / Access Tier | Username | Password | Dedicated Dashboard | Primary Capabilities |
|---|---|---|---|---|
| **Platform Administrator** | `admin` | `AdminPassword123!` | [`/admin-dashboard`](http://localhost:5173/admin-dashboard) | Global telemetry, promote/demote roles, tune operational settings, inspect audit log |
| **Trust & Safety Moderator** | `moderator` | `ModPassword123!` | [`/moderator`](http://localhost:5173/moderator) | Review flagged reports queue, inspect photos, take actions with mandatory rationale |
| **Registered Citizen** | `citizen` | `CitizenPassword123!` | [`/dashboard`](http://localhost:5173/dashboard) | Submit hazards, confirm reports, flag inaccuracies, view personal impact stats |
| *Extra Community Observers* | `chidi_okonkwo`, `amara_adebayo`, `tunde_balogun` | `Citizen123!` | [`/dashboard`](http://localhost:5173/dashboard) | Additional active citizens for testing community confirmations and multi-user flags |

---

## 📖 Swagger UI & API Documentation

Interactive OpenAPI 3.0 documentation is built-in and categorized into 5 functional tags:

- **Swagger UI Interactive Explorer:** [`http://127.0.0.1:8000/api/docs/`](http://127.0.0.1:8000/api/docs/) (also available at `/api/v1/docs/`)
- **ReDoc Technical Reference:** [`http://127.0.0.1:8000/api/redoc/`](http://127.0.0.1:8000/api/redoc/)
- **Raw OpenAPI 3.0 Schema (YAML):** [`http://127.0.0.1:8000/api/schema/`](http://127.0.0.1:8000/api/schema/)
- **API Discovery Root:** [`http://127.0.0.1:8000/api/v1/`](http://127.0.0.1:8000/api/v1/)

### Swagger Endpoint Tags:
1. `hazards`: Browse, submit, confirm, and flag community road hazards (with 10km proximity search).
2. `auth`: Session authentication, registration, user profile, and personal citizen dashboard.
3. `moderation`: Moderator queue, report inspection, status transitions with mandatory rationale, and decision history.
4. `admin`: Platform administration, user & role management, operational settings, and system audit trail.
5. `ai`: Google Gemini-powered AI assistants for category suggestion, wording improvement, report summarization, and duplicate detection.
6. `notifications`: In-app notification center, unread counters, Expo push token registration, and corridor safety advisories.
7. `system`: System health and discovery endpoints.

### API Endpoints Matrix (Selected)

| HTTP Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `GET` | `/api/v1/health/` | Public | System health check |
| `POST` | `/api/v1/auth/register/` | Public | Citizen account registration (rate limited: 5/hr) |
| `POST` | `/api/v1/auth/login/` | Public | Session authentication (rate limited: 10/min) |
| `POST` | `/api/v1/auth/logout/` | Authenticated | Flush session and clear cookies |
| `GET` | `/api/v1/auth/me/` | Authenticated | Return authenticated profile & role |
| `GET` | `/api/v1/auth/dashboard-summary/` | Authenticated | Citizen dashboard aggregate metrics |
| `PATCH` | `/api/v1/auth/profile/` | Authenticated | Update display name and email |
| `GET` | `/api/v1/hazards/` | Public | List paginated hazards (filters: category, status, bbox, ?lat=..&lng=..&radius_km=10) |
| `POST` | `/api/v1/hazards/` | Authenticated | Submit hazard report (JSON or Multipart with photo) |
| `POST` | `/api/v1/hazards/{id}/confirm/` | Authenticated | Add citizen confirmation (auto-confirms at threshold) |
| `POST` | `/api/v1/hazards/{id}/flags/` | Authenticated | Flag report for moderation review |
| `POST` | `/api/v1/ai/suggest-category/` | Authenticated | Suggest best hazard category using Gemini AI |
| `POST` | `/api/v1/ai/improve-description/` | Authenticated | Grammar/clarity enhancement without altering facts |
| `POST` | `/api/v1/ai/summarize-report/` | Moderator / Admin | Generate concise objective incident summary |
| `POST` | `/api/v1/ai/check-duplicates/` | Authenticated | Spatial (Haversine 1km) + temporal (48h) + AI semantic duplicate check |
| `GET` | `/api/v1/notifications/` | Authenticated | Paginated notifications for active user (?unread=true, ?type=..) |
| `GET` | `/api/v1/notifications/unread-count/` | Authenticated | Total unread notification badge count |
| `PATCH` | `/api/v1/notifications/{id}/read/` | Authenticated | Mark single notification as read |
| `POST` | `/api/v1/notifications/mark-all-read/` | Authenticated | Mark all user notifications as read |
| `POST` | `/api/v1/notifications/devices/` | Authenticated | Register/update Expo push notification device token |
| `POST` | `/api/v1/notifications/broadcast/` | Moderator / Admin | Broadcast corridor or city safety advisory |
| `GET` | `/api/v1/moderation/stats/` | Moderator / Admin | Return queue statistics |
| `GET` | `/api/v1/moderation/reports/` | Moderator / Admin | List reports pending review |
| `POST` | `/api/v1/moderation/reports/{id}/action/` | Moderator / Admin | Apply moderation decision with rationale |
| `GET` | `/api/v1/moderation/history/` | Moderator / Admin | Platform-wide moderation decision history |
| `GET` | `/api/v1/admin/stats/` | Admin Only | Platform-wide metrics for Admin Dashboard |
| `GET` | `/api/v1/admin/users/` | Admin Only | List users with search (`q`) and role filter (`role`) |
| `PATCH` | `/api/v1/admin/users/{id}/role/` | Admin Only | Promote/demote user role with audit log |
| `GET` | `/api/v1/admin/settings/` | Admin Only | Get operational platform settings |
| `PATCH` | `/api/v1/admin/settings/` | Admin Only | Update live operational settings |
| `GET` | `/api/v1/admin/audit-logs/` | Admin Only | Chronological system audit logs |

---

## 🧪 Testing & Quality Assurance

All **68 automated backend tests** and **15 automated mobile tests** pass with 100% success rate:

```powershell
# Backend Test Suite (68/68 Passing in 1.9s)
python backend/manage.py test apps
```

```text
Found 68 test(s).
Creating test database for alias 'default'...
System check identified no issues (0 silenced).
....................................................................
----------------------------------------------------------------------
Ran 68 tests in 1.975s

OK
Destroying test database for alias 'default'...
```

```powershell
# Mobile Test Suite (15/15 Passing)
npm --prefix mobile test
```

```text
--- Running RouteX Mobile Unit Tests ---
✓ 10 Security & Navigation Policy Tests Passed
--- Running RouteX Mobile Auth, API & Notification Tests ---
✓ 5 Mobile API & Notification Channel Tests Passed
All 15 RouteX Mobile Tests Passed Successfully! (15/15)
```

---

## 📁 Repository Structure

```text
RouteX/
├── .env.example              # Environment variables template
├── .env                      # Local development config (gitignored)
├── README.md                 # System overview and quick start (this file)
├── DOCUMENTATION.md          # Comprehensive full-stack technical documentation
├── run_all.bat               # One-click dual server launcher
├── run_backend.bat           # One-click backend launcher
├── run_frontend.bat          # One-click frontend launcher
├── run_mobile.bat            # One-click mobile app launcher
├── test_backend.bat          # One-click backend test runner
├── frontend/                 # React 18 + Vite 6 web client + PWA
│   ├── public/               # manifest.json, sw.js, SVG icons
│   └── src/
│       ├── app/              # Router and top-level providers
│       ├── components/       # Common, forms, feedback, hazards, layout, map, notifications
│       ├── context/          # AuthContext (RBAC), ThemeContext, NotificationContext
│       ├── pages/            # Landing, Map, Report, Auth, CustomerDashboard, Moderation, AdminDashboard
│       ├── services/         # Axios API clients (apiClient, aiService, notificationService)
│       └── utils/            # Hazard constants, design tokens
├── mobile/                   # React Native Expo application (iOS & Android)
│   ├── src/
│   │   ├── components/       # Native map screen, report form, modals, hazard cards
│   │   ├── services/         # Mobile API client, hazardService, notificationService, aiService
│   │   └── context/          # Native AuthContext and ThemeContext
│   ├── scripts/              # Automated mobile unit and security policy tests
│   └── App.tsx               # Root mobile application with native navigation and offline fallback
└── backend/                  # Django 5.1 + DRF API service
    ├── apps/
    │   ├── accounts/         # Custom user model, RBAC permissions, admin views, tests
    │   ├── hazards/          # Hazard reports, confirmations, 10km proximity search, seed commands, tests
    │   ├── moderation/       # Moderation flags, actions, audit logs, tests
    │   ├── ai_assistant/     # Google Gemini AI services, category suggestion, summarizer, duplicate detection
    │   └── notifications/    # In-app notifications, DevicePushTokens, Expo push gateway, tests
    ├── config/               # Settings, URLs, OpenAPI schema
    └── media/                # User uploaded hazard photos
```

---

## 📚 Detailed Documentation

For full architectural diagrams, component breakdown, and API schemas:
- 👉 **[DOCUMENTATION.md](file:///c:/Users/ibito/Documents/GitHub/RouteX/DOCUMENTATION.md)** — **Complete Full-Stack Technical Documentation.**
- 👉 **[ARCHITECTURE.md](file:///c:/Users/ibito/Documents/GitHub/RouteX/docs/ARCHITECTURE.md)** — Architecture and patterns.
- 👉 **[BACKLOG.md](file:///c:/Users/ibito/Documents/GitHub/RouteX/docs/BACKLOG.md)** — Prioritised queue and completed milestones.
- 👉 **[SESSIONS.md](file:///c:/Users/ibito/Documents/GitHub/RouteX/docs/SESSIONS.md)** — Session development logs and audit history.
