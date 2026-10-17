# RouteX — Teammate Onboarding & Run Guide

> **Team:** NextGen &nbsp;|&nbsp; **Product:** RouteX &nbsp;|&nbsp; **Tagline:** *Know the Road Ahead.*  
> **Status:** Production-Ready MVP &nbsp;|&nbsp; **Tests:** 28/28 Passing &nbsp;|&nbsp; **Tech Stack:** React 18, Vite 6, Tailwind CSS v4, Leaflet, Django 5.1, Django REST Framework, SQLite/PostgreSQL.

Welcome to the **RouteX** repository! This document will guide you through running the application locally, understanding the project architecture, testing the three dedicated role dashboards, and working with the live map system.

---

## ⚡ 1. Quick-Start (Up & Running in Under 2 Minutes)

### Option A: One-Click Windows Launchers (Recommended)

If you are on Windows, double-click the batch files in the root folder:

| File | Action |
|:---|:---|
| **[`run_all.bat`](file:///c:/Users/ibito/Documents/GitHub/RouteX/run_all.bat)** | **Launches both Backend & Frontend in separate windows** with migrations, seed data, and dev servers automatically running. |
| **[`run_backend.bat`](file:///c:/Users/ibito/Documents/GitHub/RouteX/run_backend.bat)** | Activates virtualenv, applies migrations, seeds accounts & hazards, and starts Django on `http://127.0.0.1:8000`. |
| **[`run_frontend.bat`](file:///c:/Users/ibito/Documents/GitHub/RouteX/run_frontend.bat)** | Starts the Vite development server on `http://localhost:5173`. |
| **[`test_backend.bat`](file:///c:/Users/ibito/Documents/GitHub/RouteX/test_backend.bat)** | Runs the full 28-test automated test suite. |

---

### Option B: Manual Command-Line Setup

#### 1. Backend Setup (Django REST Framework)
Open a terminal in the project root:

```powershell
# 1. Activate the Python virtual environment
.\backend\venv\Scripts\Activate.ps1
# On macOS / Linux: source backend/venv/bin/activate

# 2. Install dependencies (if not already installed)
pip install -r backend/requirements.txt

# 3. Apply database migrations
python backend/manage.py migrate

# 4. Seed users, hazards, and moderation data
python seed_db.py

# 5. Start the Django development server
python backend/manage.py runserver 127.0.0.1:8000
```
Backend is now live at: `http://127.0.0.1:8000/api/v1/`  
Interactive Swagger Docs: `http://127.0.0.1:8000/api/docs/`

#### 2. Frontend Setup (React + Vite + Tailwind CSS v4)
Open a second terminal window in the project root:

```powershell
cd frontend

# Install node modules (if first time)
npm install

# Start Vite dev server
npm run dev
```
Frontend is now live at: `http://localhost:5173/`

---

## 🔑 2. Seeded Accounts & Login Credentials

RouteX has a **strict 4-tier Role-Based Access Control (RBAC)** model enforced by Django permissions. The database is pre-seeded with test accounts for each role:

| Access Role | Username | Password | Direct URL | What You Can Test |
|:---|:---|:---|:---|:---|
| **Administrator** | `admin` | `AdminPassword123!` | [`/admin-dashboard`](http://localhost:5173/admin-dashboard) | • View platform-wide telemetry & active metrics.<br>• Search users, promote/demote roles with audit logs.<br>• Tune operational parameters (freshness hours, threshold).<br>• Inspect immutable system audit trail.<br>*(Custom React frontend — zero Django admin)* |
| **Moderator** | `moderator` | `ModPassword123!` | [`/moderator`](http://localhost:5173/moderator) | • Review queued community-flagged hazard reports.<br>• Inspect photographic evidence and timestamps.<br>• Confirm, resolve, or reject reports with **mandatory written justification**.<br>• View platform moderation decision history. |
| **Citizen (Registered)** | `citizen` | `CitizenPassword123!` | [`/dashboard`](http://localhost:5173/dashboard) | • Submit new hazards with coordinates and photos.<br>• Confirm existing road hazards.<br>• Flag inaccurate reports.<br>• Track personal submissions and community impact. |
| *Extra Citizens* | `chidi_okonkwo`<br>`amara_adebayo`<br>`tunde_balogun` | `Citizen123!` | [`/dashboard`](http://localhost:5173/dashboard) | Multi-user test accounts for submitting conflicting flags and multi-user community confirmations. |
| **Anonymous Visitor** | *Unauthenticated* | *None* | [`/`](http://localhost:5173/) & [`/map`](http://localhost:5173/map) | Browse public map, filter hazards, open report slide-over, view timestamps and freshness. |

---

## 🗺️ 3. How the Map System Works (OpenStreetMap & Esri)

### Why the Map was Showing a Grey Canvas Earlier:
1. **Carto Deprecation:** Commercial tile CDNs (like Carto) now require paid API keys and stamp watermarks over free tiers.
2. **OpenStreetMap CDN Timeout:** The standard `tile.openstreetmap.org` server frequently throttles, rate-limits, or times out on certain regional networks and ISPs in Africa.

### How it is Solved in RouteX:
RouteX includes a multi-CDN map layer system in [`HazardMap.jsx`](file:///c:/Users/ibito/Documents/GitHub/RouteX/frontend/src/components/map/HazardMap.jsx):
1. **Primary Layer — OpenStreetMap Fast CDN (`OSM`):** Powered by `https://tile.openstreetmap.de/{z}/{x}/{y}.png`. Completely open, free, zero API keys required, and responds in under 0.5s.
2. **Secondary Layer — Esri World Streets (`Esri Streets`):** Powered by ArcGIS high-speed global CDN (`https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}`). 100% reliable global fallback.
3. **Instant Layer Switcher Pill:** A floating switcher button in the top-right corner of the map lets users switch between `OSM` and `Esri Streets` with one click!
4. **Zero-Inversion Dark Mode:** In dark theme, a hardware-accelerated CSS filter smoothly darkens the base street tiles to match RouteX's navy palette (`#0B161E`), while Leaflet keeps hazard markers, popups, and badges in separate DOM layers so **pins and icons remain 100% bright, full-color, and un-inverted**.
5. **Auto-Resize Handler (`map.invalidateSize()`):** The map automatically recalculates its viewport on mount and window resize, preventing grey tile clipping when tabs switch.

---

## 📁 4. Project Structure & Architecture

```text
RouteX/
├── run_all.bat               # Windows one-click launcher for Backend + Frontend
├── run_backend.bat           # Starts Django dev server + migrations + seeding
├── run_frontend.bat          # Starts Vite dev server on http://localhost:5173
├── test_backend.bat          # Runs 28/28 Django test suite
├── seed_db.py                # Python ORM database seeder
├── seed_db.sql               # Pure SQL dump of seeded tables
├── TEAM_GUIDE.md             # This document!
├── README.md                 # Public repository overview
├── DOCUMENTATION.md          # Comprehensive full-stack architectural reference
│
├── backend/                  # Django 5.1 + Django REST Framework
│   ├── manage.py
│   ├── config/               # Settings, Root URLs, WSGI/ASGI
│   │   ├── settings.py       # DRF config, CORS, Spectacular OpenAPI settings
│   │   └── urls.py           # Top-level API routing & Swagger endpoints
│   ├── apps/
│   │   ├── accounts/         # Users, Roles, Profile, PlatformSettings, SystemAuditLog
│   │   │   ├── models.py     # UserProfile (citizen/moderator/admin), PlatformSettings
│   │   │   ├── permissions.py# IsCitizen, IsModeratorUser, IsPlatformAdmin classes
│   │   │   ├── views.py      # Auth: CSRF, login, logout, me, profile, summary
│   │   │   ├── views_admin.py# Custom Admin API: stats, users, role update, settings
│   │   │   └── urls_admin.py # /api/v1/admin/* routing
│   │   ├── hazards/          # Core reporting domain
│   │   │   ├── models.py     # HazardReport, Confirmation, HazardFlag
│   │   │   ├── views.py      # Bounding-box spatial search, filters, actions
│   │   │   └── serializers.py# Hazard serializers with photo & freshness calculation
│   │   ├── moderation/       # Trust & Safety moderation domain
│   │   │   ├── models.py     # ModerationAction (action, reason, moderator)
│   │   │   └── views.py      # Queue, inspection, mandatory rationale enforcement
│   │   └── common/           # Shared models & timestamp mixins
│
└── frontend/                 # React 18 + Vite 6 + Tailwind CSS v4
    ├── index.html            # PWA entry, meta tags, and Web App manifest link
    ├── vite.config.js        # Vite config with dev proxy for /api and /media
    ├── public/
    │   ├── manifest.json     # PWA standalone manifest
    │   ├── sw.js             # Service Worker (offline app shell cache & network-first)
    │   └── routex-logo.svg   # Vector brand mark
    └── src/
        ├── app/
        │   └── router.jsx    # React Router DOM v6 route hierarchy
        ├── pages/
        │   ├── LandingPage.jsx         # Public landing page (/) with scroll reveal
        │   ├── MapPage.jsx             # Interactive map (/map) with filters
        │   ├── CustomerDashboardPage.jsx # Citizen portal (/dashboard & /my-reports)
        │   ├── ModerationPage.jsx      # Moderator review workspace (/moderator)
        │   ├── AdminDashboardPage.jsx  # Custom Platform Admin portal (/admin-dashboard)
        │   ├── LoginPage.jsx           # Session auth (/login)
        │   └── RegisterPage.jsx        # Citizen account creation (/register)
        ├── components/
        │   ├── common/       # RouteXLogo, RevealOnScroll animation wrapper
        │   ├── forms/        # ReportHazardForm with photo upload & validation
        │   ├── hazards/      # HazardCard, HazardDetailsPanel, CategoryBadge
        │   ├── layout/       # AppHeader with theme toggle, role badge & PWA install
        │   └── map/          # HazardMap, HazardMarker, LocationPickerMap
        ├── context/
        │   ├── AuthContext.jsx   # Session auth state, user role, login/logout
        │   └── ThemeContext.jsx  # Light/Dark mode with system fallback
        └── services/
            └── apiClient.js  # Axios client with CSRF interceptors & API services
```

---

## 🌐 5. Frontend Pages & URLs

All routes are powered by React Router v6:

| Route Path | Description | Access Required |
|:---|:---|:---|
| `/` | **Public Landing Page** with live community road pulse, emergency guide, and PWA install trigger | Public |
| `/map` | **Interactive Hazard Map** with category/status filters, bounding box sync, and report details | Public |
| `/report` | **Hazard Submission Flow** with interactive location pin picker and photo evidence | Registered Citizen |
| `/login` & `/register` | **Authentication Pages** with session cookies and CSRF protection | Public |
| `/dashboard` | **Citizen Commuter Dashboard** displaying personal stats, impact metrics, and submissions | Registered Citizen |
| `/moderator` | **Trust & Safety Workspace** for reviewing flagged reports and taking justified actions | Moderator or Admin |
| `/admin-dashboard` | **Custom Admin Portal** for managing roles, operational settings, and system audit logs | Administrator Only |

---

## 📡 6. API Reference & Swagger UI

RouteX features a fully annotated OpenAPI 3.0 specification generated by `drf-spectacular`:

- **Interactive Swagger UI:** [`http://127.0.0.1:8000/api/docs/`](http://127.0.0.1:8000/api/docs/)
- **Technical ReDoc:** [`http://127.0.0.1:8000/api/redoc/`](http://127.0.0.1:8000/api/redoc/)
- **Raw OpenAPI YAML:** [`http://127.0.0.1:8000/api/schema/`](http://127.0.0.1:8000/api/schema/)

### 5 Primary API Collections:
1. **`hazards`**: List hazards with bounding box (`/api/v1/hazards/?bbox=...`), submit report, add confirmation, flag report.
2. **`auth`**: CSRF handshake (`/csrf/`), register, login, logout, get profile (`/me/`), dashboard summary (`/dashboard-summary/`).
3. **`moderation`**: Moderator queue (`/moderation/reports/`), perform action with reason (`/moderation/reports/{id}/action/`), decision history (`/history/`).
4. **`admin`**: Platform stats (`/admin/stats/`), user management (`/admin/users/`), role mutation (`/admin/users/{id}/role/`), settings (`/admin/settings/`), audit logs (`/admin/audit-logs/`).
5. **`system`**: Discovery root (`/api/v1/`) and health check (`/api/v1/health/`).

---

## 🛠️ 7. Useful Developer Commands

### Running Backend Tests (100% Pass Rate):
```powershell
python backend/manage.py test apps
```
*(Runs all 28 unit and API integration tests in < 0.8s)*

### Validating Swagger OpenAPI Schema:
```powershell
python backend/manage.py spectacular --validate
```

### Re-seeding the Database:
```powershell
python seed_db.py
# Or with SQL:
# sqlite3 backend/db.sqlite3 < seed_db.sql
```

### Building Frontend for Production:
```powershell
cd frontend
npm run build
```

---

## 💡 8. Troubleshooting Common Questions

### Q: Why do I see "Unable to load reports" on the map page?
**A:** Ensure the Django backend is running on `http://127.0.0.1:8000`. The Vite frontend proxies `/api` and `/media` requests directly to port 8000. Run `run_backend.bat` or `python backend/manage.py runserver 127.0.0.1:8000`.

### Q: What if the map tiles look grey or slow on my network?
**A:** Click the **`Esri Streets`** button in the top-right corner of the map. It switches instantly to the high-speed global ArcGIS CDN, bypassing any local ISP blocks on OpenStreetMap.

### Q: How do I test the Moderator Queue with real flagged items?
**A:** Log out, sign in as `moderator` with password `ModPassword123!`, and navigate to [`/moderator`](http://localhost:5173/moderator). You will see flagged reports ready for inspection, where you can verify, resolve, or dismiss them with mandatory rationale.

### Q: How do I test promoting a citizen to a moderator?
**A:** Sign in as `admin` with password `AdminPassword123!`, navigate to [`/admin-dashboard`](http://localhost:5173/admin-dashboard), find any user (e.g. `chidi_okonkwo`), click **Change Role**, select **Moderator**, provide an audit justification, and submit. The audit log will immediately record the action.

---

*Team NextGen — RouteX*  
*Know the Road Ahead.*
