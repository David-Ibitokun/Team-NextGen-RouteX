# RouteX — Complete System & Page Documentation

> **Product:** RouteX  
> **Tagline:** *Know the Road Ahead.*  
> **Team:** NextGen  
> **Category:** Community-Powered Road Hazard Reporting and Awareness Platform  
> **Scope:** Universal Community Road Awareness (not restricted to any single municipality)  
> **Target Audience:** Daily commuters, drivers, cyclists, pedestrians, community contributors, safety moderators, and platform administrators.

---

## Table of Contents
1. [Account Types, Roles & Permissions Architecture](#1-account-types-roles--permissions-architecture)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Frontend Architecture & Page-by-Page Guide](#3-frontend-architecture--page-by-page-guide)
   - [Page 1: Public Landing Page (`/`)](#page-1-public-landing-page-)
   - [Page 2: Interactive Hazard Map (`/map`)](#page-2-interactive-hazard-map-map)
   - [Page 3: Report a Hazard (`/report`)](#page-3-report-a-hazard-report)
   - [Page 4: User Authentication (`/login` & `/register`)](#page-4-user-authentication-login--register)
   - [Page 5: Citizen Commuter Dashboard (`/dashboard`)](#page-5-citizen-commuter-dashboard-dashboard)
   - [Page 6: Moderator Trust & Safety Queue (`/moderator`)](#page-6-moderator-trust--safety-queue-moderator)
   - [Page 7: Platform Administrator Portal (`/admin-dashboard`)](#page-7-platform-administrator-portal-admin-dashboard)
   - [Progressive Web App (PWA) Architecture](#progressive-web-app-pwa-architecture)
   - [Frontend State, Context & Service Layer](#frontend-state-context--service-layer)
   - [Scroll Animations & Design Tokens](#scroll-animations--design-tokens)
4. [Mobile Application Architecture (Expo React Native Shell)](#4-mobile-application-architecture-expo-react-native-shell)
   - [Mobile Architecture & Security Boundary](#mobile-architecture--security-boundary)
   - [Component Hierarchy & Native Shell Controls](#component-hierarchy--native-shell-controls)
   - [Hardware Back Button & Navigation Handling](#hardware-back-button--navigation-handling)
   - [Environment Configuration & Networking (Emulator vs LAN)](#environment-configuration--networking-emulator-vs-lan)
   - [Automated Mobile Unit Testing (15/15 Passing)](#automated-mobile-unit-testing-1515-passing)
5. [Backend Architecture & API Reference](#5-backend-architecture--api-reference)
   - [Django Application Architecture](#django-application-architecture)
   - [Accounts App (`apps.accounts`)](#accounts-app-appsaccounts)
   - [Hazards App & 10km Proximity (`apps.hazards`)](#hazards-app-appshazards)
   - [Moderation App (`apps.moderation`)](#moderation-app-appsmoderation)
   - [AI Assistant App (`apps.ai_assistant`)](#ai-assistant-app-appsai_assistant)
   - [Notifications App (`apps.notifications`)](#notifications-app-appsnotifications)
   - [Complete API Endpoints Matrix (36 Endpoints)](#complete-api-endpoints-matrix)
   - [OpenAPI 3.0 & Swagger UI Documentation](#openapi-30--swagger-ui-documentation)
6. [Security, Session Auth & CSRF Protection](#6-security-session-auth--csrf-protection)
7. [Automated Testing & Quality Assurance (68 Backend + 15 Mobile Passing)](#7-automated-testing--quality-assurance-68-backend--15-mobile-passing)
8. [Developer Quick-Start & Team Onboarding](#8-developer-quick-start--team-onboarding)

---

## 1. Account Types, Roles & Permissions Architecture

RouteX defines **four distinct account and access types**, strictly enforced on the Django backend through custom Django REST Framework permission classes:

```text
+-------------------+------------------------------------------------------------------------+
| Access Level      | Core Responsibilities & Capabilities                                   |
+-------------------+------------------------------------------------------------------------+
| 1. Anonymous      | Public access: View landing page, browse live map, filter hazards by   |
|    Visitor        | category & status, inspect timestamps. Cannot report, confirm, or flag.|
+-------------------+------------------------------------------------------------------------+
| 2. Registered     | Citizen commuter: Create road hazard reports with location & photos,   |
|    User (Citizen) | confirm active hazards, flag inaccurate reports, view personal stats   |
|                   | on the Citizen Dashboard.                                              |
+-------------------+------------------------------------------------------------------------+
| 3. Moderator      | Trust & safety: Review flagged reports, inspect photographic evidence, |
|    (Staff)        | mark reports under review/confirmed/resolved/rejected with mandatory   |
|                   | audit rationale, inspect moderation decision history.                  |
+-------------------+------------------------------------------------------------------------+
| 4. Administrator  | Governance & operations: Manage user roles (promote/demote), configure |
|    (Admin)        | operational parameters (freshness hours, auto-confirm threshold, max   |
|                   | upload size), oversee platform audit logs. Custom UI (no Django admin).|
+-------------------+------------------------------------------------------------------------+
```

### Permissions Comparison Matrix

| Feature / Capability | Anonymous Visitor | Registered Citizen | Moderator | Administrator |
|---|:---:|:---:|:---:|:---:|
| Browse Landing Page & Live Map | ✅ | ✅ | ✅ | ✅ |
| Filter Hazards & View Detail Panel | ✅ | ✅ | ✅ | ✅ |
| Submit Road Hazard Report | ❌ | ✅ | ✅ | ✅ |
| Upload Photographic Evidence | ❌ | ✅ | ✅ | ✅ |
| Confirm Active Hazard (1 per user) | ❌ | ✅ | ✅ | ✅ |
| Submit Report Flag for Review | ❌ | ✅ | ✅ | ✅ |
| Access Citizen Dashboard (`/dashboard`) | ❌ | ✅ | ✅ | ✅ |
| Access Moderator Queue (`/moderator`) | ❌ | ❌ | ✅ | ✅ |
| Perform Moderation Action with Reason | ❌ | ❌ | ✅ | ✅ |
| Access Admin Portal (`/admin-dashboard`) | ❌ | ❌ | ❌ | ✅ |
| Manage User Roles (Promote/Demote) | ❌ | ❌ | ❌ | ✅ |
| Configure Live Operational Parameters | ❌ | ❌ | ❌ | ✅ |
| Inspect System-Wide Audit Logs | ❌ | ❌ | ❌ | ✅ |

### Server-Enforced Registration Rules
1. **Public Registration Always Assigns Citizen:** The public registration endpoint (`POST /api/v1/auth/register/`) always assigns `role="citizen"`. The client cannot pass or inject privileged roles.
2. **Role Promotion via Admin API Only:** Administrators assign `moderator` or `admin` privileges via `PATCH /api/v1/admin/users/{id}/role/`.
3. **Self-Demotion Safeguard:** An administrator cannot strip administrative privileges from their own active account session.

---

## 2. System Architecture Overview

```text
+---------------------------------------------------------------------------------+
|                                 CLIENT WEB TIER                                 |
|  React 18 + Vite 6 + Tailwind CSS v4 + React Leaflet + Lucide React + PWA       |
|  - Landing Page with GPU-accelerated Scroll Reveal Animations                   |
|  - Interactive Map with Viewport Bounding-Box Debouncing (OSM / CartoDB)        |
|  - Three Distinct Dashboards: Citizen, Moderator, Administrator                 |
|  - Progressive Web App: Service Worker (sw.js) + Web App Manifest + Install UI  |
+---------------------------------------------------------------------------------+
                                       |
                                       | HTTP REST / JSON / Multipart Form-Data
                                       | (withCredentials: true, X-CSRFToken Header)
                                       v
+---------------------------------------------------------------------------------+
|                                API & SERVICE TIER                               |
|  Python 3.13 + Django 5.1 + Django REST Framework + drf-spectacular             |
|  - RBAC Permission Classes: IsCitizen, IsModeratorUser, IsPlatformAdmin         |
|  - Database-backed Session Authentication & Anon Rate Limiting Throttles        |
|  - MultiPart Image Validation & Storage (Pillow, 5MB limit, format checks)       |
|  - Bounding Box Coordinate Validation (-90..90, -180..180, bbox queries)        |
|  - Live Operational Settings: Freshness Window, Confirmation Auto-Threshold     |
|  - System Audit Trail (SystemAuditLog + ModerationAction)                       |
+---------------------------------------------------------------------------------+
                                       |
                                       | Django ORM (Engine Agnostic)
                                       v
+---------------------------------------------------------------------------------+
|                                PERSISTENCE TIER                                 |
|  PostgreSQL (Production) / SQLite3 (Zero-Config Development Fallback)            |
|  Media Storage for photographic evidence                                         |
+---------------------------------------------------------------------------------+
```

---

## 3. Frontend Architecture & Page-by-Page Guide

The client application is built with React 18, Vite 6, Tailwind CSS v4, React Router 7, and Lucide React.

### Frontend Route Registry
- **`/`** — Public Landing Page
- **`/map`** — Interactive Hazard Map
- **`/report`** — Report a Hazard (Protected)
- **`/login`** — Citizen Account Sign In
- **`/register`** — New Citizen Registration
- **`/dashboard`** (or `/my-reports`) — Citizen Commuter Dashboard
- **`/moderator`** (or `/moderation`) — Moderator Trust & Safety Queue (Staff Only)
- **`/admin-dashboard`** (or `/admin`) — Platform Administrator Portal (Admin Only)

---

### Page 1: Public Landing Page (`/`)
- **Component:** [`frontend/src/pages/LandingPage.jsx`](file:///c:/Users/ibito/Documents/GitHub/RouteX/frontend/src/pages/LandingPage.jsx)
- **Access:** Public (No authentication required)
- **Key Sections:**
  1. **Header & Navigation (`AppHeader`)**: Logo mark, links, theme switch, role-aware user menu, and PWA Install button.
  2. **Hero Section**: Eyebrow label, value proposition (*“Know the road ahead.”*), dual CTAs, reassurance notice, and live Leaflet map preview with real API reports.
  3. **Trust Strip**: Highlighting community-powered reports, clear timestamps, and transparent statuses.
  4. **How It Works**: 3 numbered workflow cards (*01 Explore map*, *02 Share what you see*, *03 Help keep reports useful*).
  5. **Feature Showcase**: 4 capability cards with clean design.
  6. **Live Community Road Pulse**: Real-time stream of latest community hazard observations with freshness badges and direct map links.
  7. **Hazard Category Cards**: Interactive access to RouteX's 5 supported categories (*Flooding*, *Potholes*, *Blocked roads*, *Fallen trees*, *Other hazards*).
  8. **Emergency vs Road Hazard Advisory**: Side-by-side civic clarity distinguishing RouteX hazard reports from urgent 112/911 emergencies.
  9. **Citizen Road Safety Pledge**: 4 golden principles for citizen observers (no driving reports, precise coordinates, objective descriptions, thoughtful verification).
  10. **Safety and Trust Section**: Restrained statement on freshness, community confirmations, and moderation.
  11. **Native Progressive Web App (PWA) Showcase**: Highlighting zero-store install, offline shell launch, and one-click "Install RouteX App" button.
  12. **FAQ Accordion**: 7 interactive accordions answering common product questions.
  13. **Lower CTA & Brand Footer**: Navigation links, Swagger API link, and OpenStreetMap attribution.

---

### Page 2: Interactive Hazard Map (`/map`)
- **Component:** [`frontend/src/pages/MapPage.jsx`](file:///c:/Users/ibito/Documents/GitHub/RouteX/frontend/src/pages/MapPage.jsx)
- **Access:** Public
- **Features:** Full-viewport Leaflet map with CartoDB Dark Matter / OSM tiles, debounced viewport bounding-box queries (`bbox=west,south,east,north`), category & status filtering, and slide-over hazard inspection panel with one-click confirmation and flag triggers.

---

### Page 3: Report a Hazard (`/report`)
- **Component:** [`frontend/src/pages/ReportHazardPage.jsx`](file:///c:/Users/ibito/Documents/GitHub/RouteX/frontend/src/pages/ReportHazardPage.jsx) & [`ReportHazardForm.jsx`](file:///c:/Users/ibito/Documents/GitHub/RouteX/frontend/src/components/forms/ReportHazardForm.jsx)
- **Access:** Authenticated Citizens, Moderators, and Admins. Unauthenticated visitors are redirected to `/login?redirect=/report`.
- **Features:** Category selection grid, interactive drag-and-drop location picker map, GPS "Use my current location", title, description, and optional photo upload with client-side image preview and server-side Pillow inspection.

---

### Page 4: User Authentication (`/login` & `/register`)
- **Components:** [`LoginPage.jsx`](file:///c:/Users/ibito/Documents/GitHub/RouteX/frontend/src/pages/LoginPage.jsx), [`RegisterPage.jsx`](file:///c:/Users/ibito/Documents/GitHub/RouteX/frontend/src/pages/RegisterPage.jsx)
- **Features:** Session-backed authentication, automatic CSRF token injection, client password confirmation validation, and seamless redirection to intended destination after sign-in.

---

### Page 5: Citizen Commuter Dashboard (`/dashboard`)
- **Component:** [`frontend/src/pages/CustomerDashboardPage.jsx`](file:///c:/Users/ibito/Documents/GitHub/RouteX/frontend/src/pages/CustomerDashboardPage.jsx)
- **Access:** Authenticated Citizens (and privileged users).
- **Features:**
  - **Welcome Banner:** User greeting, username, join date, and Citizen Contributor badge.
  - **Personal Metric Tiles:** Total Submissions, Confirmations Received, Active Hazards, Resolved Hazards.
  - **Tab 1 — My Road Reports:** List of user submissions with category icons, status filters, freshness indicators, confirmation counts, and direct map links.
  - **Tab 2 — Community Impact:** Verification rate, community scout badges, and observer guidelines.
  - **Tab 3 — Account & Profile Settings:** Inline form to update display name and email address with real-time feedback.

---

### Page 6: Moderator Trust & Safety Queue (`/moderator`)
- **Component:** [`frontend/src/pages/ModerationPage.jsx`](file:///c:/Users/ibito/Documents/GitHub/RouteX/frontend/src/pages/ModerationPage.jsx)
- **Access:** Strictly restricted to users with `role in ['moderator', 'admin']` or `is_staff=True`.
- **Features:**
  - **Metric Tiles:** Pending Flags, Under Review, Active Reported, Resolved.
  - **Tab 1 — Queue Reports:** Filter between "All Reports" and "Flagged Only". Action buttons: *Confirm Hazard*, *Mark Under Review*, *Mark Resolved*, *Reject / Dismiss*.
  - **Decision Modal:** Enforces a mandatory justification rationale (min 3 characters) for every moderation action.
  - **Tab 2 — Moderation Decision History:** Chronological log of decisions taken by all moderators across the platform.

---

### Page 7: Platform Administrator Portal (`/admin-dashboard`)
- **Component:** [`frontend/src/pages/AdminDashboardPage.jsx`](file:///c:/Users/ibito/Documents/GitHub/RouteX/frontend/src/pages/AdminDashboardPage.jsx)
- **Access:** Strictly restricted to users with `role == 'admin'` or `is_superuser=True`. Non-admins receive an explicit 403 access barrier.
- **Features (Dedicated Custom Frontend UI, No Django Admin):**
  - **Platform Overview Tiles:** Total Registered Users (Citizens, Mods, Admins), Hazard Totals (Active, Confirmed, Flagged), Operational Engine Status.
  - **Tab 1 — User & Role Management:**
    - Search users by username or email.
    - Role filter buttons: *All*, *Citizen*, *Moderator*, *Admin*.
    - Users table displaying Username, Display Name, Email, Role badge, Reports submitted, Date joined.
    - Role update modal: Promote or demote any user to `citizen`, `moderator`, or `admin`, with mandatory audit reason. Safeguards prevent self-demotion.
  - **Tab 2 — Operational Platform Settings:**
    - Live configuration form connected to `GET/PATCH /api/v1/admin/settings/`:
      - *Confirmation Auto-Threshold* (1–20 confirmations)
      - *Report Freshness Window* (1–168 hours)
      - *Max Photographic Upload Size* (1–25 MB)
    - Instant live persistence with server-side validation.
  - **Tab 3 — System Audit Trail:**
    - Searchable chronological timeline of all administrative events (role promotions, parameter mutations, moderation overrides).

---

### Progressive Web App (PWA) Architecture

RouteX provides a native-like installable experience:
1. **Web App Manifest ([`frontend/public/manifest.json`](file:///c:/Users/ibito/Documents/GitHub/RouteX/frontend/public/manifest.json))**:
   - `display: standalone`
   - Custom theme color `#142B3B` and accent `#087F8C`
   - High-resolution SVG icons with `purpose: any maskable`
   - App shortcuts for quick launch to Map, Report, and Dashboard.
2. **Service Worker ([`frontend/public/sw.js`](file:///c:/Users/ibito/Documents/GitHub/RouteX/frontend/public/sw.js))**:
   - Pre-caches core app shell (`/`, `/index.html`, `/manifest.json`, `/favicon.svg`, `/routex-logo.svg`).
   - Network-first navigation strategy with offline cache fallback.
   - Stale-while-revalidate caching for static CSS, JS, and image assets.
   - Passes through live `/api/` requests to avoid caching stale road observations.
3. **Native Install Prompt UX**:
   - Captures browser `beforeinstallprompt` events.
   - Surfaces accessible "Install App" button in `AppHeader`, mobile drawer, and Landing Page.

---

## 4. Mobile Application Architecture (Expo React Native Shell)

RouteX features a dedicated Android mobile container in [`mobile/`](file:///c:/Users/ibito/Documents/GitHub/RouteX/mobile) built with **React Native and Expo (SDK 57)** in TypeScript, specifically targeted for compatibility with the current Expo Go client available on the Google Play Store. It provides a secure, branded application shell hosting the responsive RouteX web application inside an Android `WebView`.

```text
┌────────────────────────────────────────────────────────┐
│           Expo React Native Container (Android)        │
│  - SafeAreaProvider & StatusBar (Navy #142B3B)         │
│  - RouteXHeader (Native app bar with reload & back)   │
│  - Android Hardware BackButton Handler                 │
│  - Security boundary & Origin Validation               │
├────────────────────────────────────────────────────────┤
│                      WebView                           │
│  - RouteX Responsive Web App (React 18 + Vite)        │
│  - Leaflet Map + OpenStreetMap zero-key tiles          │
│  - Cookie sharing & session authentication            │
│  - Geolocation & camera photo capture                 │
└────────────────────────────────────────────────────────┘
                           │ HTTP / JSON
                           ▼
             Django REST Framework API (v1)
                           │ ORM
                           ▼
                  PostgreSQL / SQLite
```

### Mobile Architecture & Security Boundary
- **Origin Validation ([`urlPolicy.ts`](file:///c:/Users/ibito/Documents/GitHub/RouteX/mobile/src/navigation/urlPolicy.ts)):** Top-level navigation is strictly limited to the configured `EXPO_PUBLIC_WEB_URL` origin.
- **External URL Delegation:** External hyperlinks (e.g. OpenStreetMap attribution, licensing pages) are automatically intercepted and delegated to the Android device's default system browser via `Linking.openURL()`.
- **Scheme Blocking:** Insecure schemes such as `javascript:`, `file:`, `data:`, and `vbscript:` are blocked immediately.
- **Cookie & Storage Isolation:** Web session cookies (`sessionid`, `csrftoken`) and `localStorage` are shared with the WebView (`sharedCookiesEnabled={true}`), while third-party cookies are disabled (`thirdPartyCookiesEnabled={false}`).
- **Mixed Content Enforcement:** Insecure HTTP assets inside HTTPS connections are strictly disallowed (`mixedContentMode="never"`).

### Component Hierarchy & Native Shell Controls
- **[`App.tsx`](file:///c:/Users/ibito/Documents/GitHub/RouteX/mobile/App.tsx):** Root coordinator rendering `SafeAreaProvider`, `StatusBar style="light"`, and switching between configuration diagnostics and the active webview.
- **[`RouteXHeader.tsx`](file:///c:/Users/ibito/Documents/GitHub/RouteX/mobile/src/components/RouteXHeader.tsx):** Branded top bar featuring RouteX emblem, product name, "Know the Road Ahead." tagline, web navigation back action, and instant page refresh trigger.
- **[`RouteXWebView.tsx`](file:///c:/Users/ibito/Documents/GitHub/RouteX/mobile/src/components/RouteXWebView.tsx):** Encapsulated WebView supporting Android geolocation (`geolocationEnabled={true}`), HTML5 file inputs (`<input type="file">`), error recovery boundaries, and React 19 type interoperability.
- **[`LoadingScreen.tsx`](file:///c:/Users/ibito/Documents/GitHub/RouteX/mobile/src/components/LoadingScreen.tsx):** Accessible RouteX splash screen rendered during initial network connection.
- **[`ErrorScreen.tsx`](file:///c:/Users/ibito/Documents/GitHub/RouteX/mobile/src/components/ErrorScreen.tsx):** Recoverable error screen with network diagnostics (host loopback tips for `10.0.2.2` vs LAN IP) and one-tap Retry.
- **[`ConfigMissingScreen.tsx`](file:///c:/Users/ibito/Documents/GitHub/RouteX/mobile/src/components/ConfigMissingScreen.tsx):** Step-by-step setup guide shown if `EXPO_PUBLIC_WEB_URL` is omitted or malformed.

### Hardware Back Button & Navigation Handling
- If the user has navigated across pages in the RouteX web application (`canGoBack === true`), pressing the physical Android back button steps back through web history via `webViewRef.current.goBack()`.
- If the user is at the root homepage (`canGoBack === false`), an exit confirmation modal prevents accidental application exit.

### Environment Configuration & Networking (Emulator vs LAN)
The mobile shell reads `EXPO_PUBLIC_WEB_URL` from `mobile/.env`:
- **Android Studio Emulator:** Set `EXPO_PUBLIC_WEB_URL=http://10.0.2.2:5173` (connecting to host machine).
- **Physical Android Phone:** Set `EXPO_PUBLIC_WEB_URL=http://<YOUR_LAN_IP>:5173` (e.g. `http://192.168.0.178:5173`).
- **Production / Staging:** Set `EXPO_PUBLIC_WEB_URL=https://routex.app`.

---

## 5. Backend Architecture & API Reference

### Django Apps
- **`apps.accounts`**: Custom `UserProfile` with `role` choices (`citizen`, `moderator`, `admin`), `PlatformSettings` singleton, `SystemAuditLog`, session auth views, and `views_admin.py`.
- **`apps.hazards`**: `HazardReport`, `Confirmation`, 10km geospatial proximity filtering (`?lat=..&lng=..&radius_km=10`), bounding-box pre-filtering, exact spherical Haversine distance calculations (`distance_km`), Pillow image validation, and `seed_demo_hazards` command.
- **`apps.moderation`**: `ModerationAction`, flag tracking, and review queue endpoints with mandatory audit rationale.
- **`apps.ai_assistant`**: Server-side Google Gemini adapter (`GeminiService`) with JSON schema enforcement, category suggestions, wording enhancer, neutral incident summarizer, and hybrid geospatial + temporal duplicate detection.
- **`apps.notifications`**: Persistent notification models (`Notification`, `DevicePushToken`), event triggers hooked to hazard lifecycle, Expo push notification gateway, unread counter badges, and corridor broadcast safety advisories.

### Complete API Endpoints Matrix

| HTTP Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `GET` | `/api/v1/` | Public | API discovery root |
| `GET` | `/api/v1/health/` | Public | Service health check |
| `GET` | `/api/v1/auth/csrf/` | Public | Set and return CSRF cookie |
| `POST` | `/api/v1/auth/register/` | Public | Citizen account registration (rate limited: 5/hr) |
| `POST` | `/api/v1/auth/login/` | Public | Session authentication (rate limited: 10/min) |
| `POST` | `/api/v1/auth/logout/` | Authenticated | Flush session and clear cookies |
| `GET` | `/api/v1/auth/me/` | Authenticated | Return profile, display name, and role |
| `GET` | `/api/v1/auth/me/reports/` | Authenticated | Return user's submitted hazard reports |
| `GET` | `/api/v1/auth/dashboard-summary/` | Authenticated | Return aggregate counts for Citizen Dashboard |
| `PATCH` | `/api/v1/auth/profile/` | Authenticated | Update display name and email address |
| `GET` | `/api/v1/hazards/` | Public | List paginated hazards (filters: category, status, bbox, ?lat=..&lng=..&radius_km=10) |
| `POST` | `/api/v1/hazards/` | Authenticated | Submit hazard report (JSON or Multipart with photo) |
| `GET` | `/api/v1/hazards/{id}/` | Public | Single hazard detail |
| `POST` | `/api/v1/hazards/{id}/confirm/` | Authenticated | Add community confirmation (auto-confirms at threshold) |
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
| `GET` | `/api/v1/moderation/stats/` | Moderator / Admin | Return queue statistics (pending flags, under review) |
| `GET` | `/api/v1/moderation/reports/` | Moderator / Admin | List reports for review (filter by status, flagged_only) |
| `POST` | `/api/v1/moderation/reports/{id}/action/` | Moderator / Admin | Apply moderation action (review, confirm, resolve, reject) |
| `GET` | `/api/v1/moderation/reports/{id}/actions/` | Moderator / Admin | Action history for a specific report |
| `GET` | `/api/v1/moderation/history/` | Moderator / Admin | Platform-wide moderation decision history |
| `GET` | `/api/v1/admin/stats/` | Admin Only | Platform-wide metrics for Admin Dashboard |
| `GET` | `/api/v1/admin/users/` | Admin Only | List users with search (`q`) and role filter (`role`) |
| `PATCH` | `/api/v1/admin/users/{id}/role/` | Admin Only | Promote/demote user role with audit log |
| `GET` | `/api/v1/admin/settings/` | Admin Only | Get operational platform settings |
| `PATCH` | `/api/v1/admin/settings/` | Admin Only | Update live operational settings |
| `GET` | `/api/v1/admin/audit-logs/` | Admin Only | Chronological system audit logs |

---

## 6. Security, Session Auth & CSRF Protection

- **Cookie Security:** Uses Django's secure database-backed session engine (`django.contrib.sessions`).
- **CSRF Token Injection:** All non-GET requests require valid `X-CSRFToken` header matching the cookie.
- **Rate Throttling:** Anonymous login endpoints are throttled at 10 requests/minute per IP; registration at 5 requests/hour.
- **Pillow Image Sanitization:** Uploaded photos are inspected to ensure valid image headers, non-executable content, and size under configured MB limit.
- **Mobile Origin Allowlist:** The mobile WebView enforces strict same-origin navigation, redirecting foreign origins to the external system browser and blocking unsafe schemes (`javascript:`, `file:`, `data:`).

---

## 7. Automated Testing & Quality Assurance (68 Backend + 15 Mobile Passing)

### Backend Test Suite (68/68 Passing in 1.9s)
```powershell
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

### Mobile Test Suite (15/15 Passing)
```powershell
npm --prefix mobile test
```

```text
--- Running RouteX Mobile Unit Tests ---
✓ Test 1 Passed: Empty URL handled safely
✓ Test 2 Passed: Non-HTTP/HTTPS protocol rejected
✓ Test 3 Passed: Valid URL parsed and normalized
✓ Test 4 Passed: RouteX internal origin allowed
✓ Test 5 Passed: about:blank initialization allowed
✓ Test 6 Passed: javascript: scheme blocked
✓ Test 7 Passed: file: scheme blocked
✓ Test 8 Passed: tel: scheme delegated externally
✓ Test 9 Passed: External links redirected to system browser
✓ Test 10 Passed: Malformed URLs rejected

All 10 RouteX Mobile Tests Passed Successfully! (10/10)
--- Running RouteX Mobile Auth, API & Notification Tests ---
✓ Test 1 Passed: API Base URL normalization strips trailing slashes
✓ Test 2 Passed: Registration validation rejects invalid credentials
✓ Test 3 Passed: Registration validation accepts valid credentials
✓ Test 4 Passed: Cookie extraction correctly parses sessionid and csrftoken
✓ Test 5 Passed: Hazard report notification properly formats category and location

All 5 RouteX Mobile Auth & API Tests Passed Successfully! (5/5)
```

---

## 8. Developer Quick-Start & Team Onboarding

### One-Click Launchers (Windows)
- [`run_all.bat`](file:///c:/Users/ibito/Documents/GitHub/RouteX/run_all.bat) — Starts backend (`http://127.0.0.1:8000/`) and frontend (`http://localhost:5173/`).
- [`run_mobile.bat`](file:///c:/Users/ibito/Documents/GitHub/RouteX/run_mobile.bat) — Starts the Expo mobile development server with auto-configured `.env`.
- [`run_backend.bat`](file:///c:/Users/ibito/Documents/GitHub/RouteX/run_backend.bat) — Starts Django server with migration and database seeding checks.
- [`run_frontend.bat`](file:///c:/Users/ibito/Documents/GitHub/RouteX/run_frontend.bat) — Starts Vite development server.
- [`test_backend.bat`](file:///c:/Users/ibito/Documents/GitHub/RouteX/test_backend.bat) — Runs the full automated backend test suite.

### Database Seeding & Demo Credentials
The database can be instantly seeded at any time using either Python or pure SQL:
- **Python Seeder:** `python seed_db.py`
- **Raw SQL Dump:** `sqlite3 backend/db.sqlite3 < seed_db.sql`

| Role / Access Tier | Username | Password | Dedicated Dashboard | Primary Capabilities |
|---|---|---|---|---|
| **Platform Administrator** | `admin` | `AdminPassword123!` | `/admin-dashboard` | Global telemetry, promote/demote roles, tune operational settings, inspect audit log |
| **Trust & Safety Moderator** | `moderator` | `ModPassword123!` | `/moderator` | Review flagged reports queue, inspect photos, take actions with mandatory rationale |
| **Registered Citizen** | `citizen` | `CitizenPassword123!` | `/dashboard` | Submit hazards, confirm reports, flag inaccuracies, view personal impact stats |
| *Extra Community Observers* | `chidi_okonkwo`, `amara_adebayo`, `tunde_balogun` | `Citizen123!` | `/dashboard` | Additional active citizens for testing community confirmations and multi-user flags |

### OpenStreetMap & Tile Rendering
- **Provider:** Official OpenStreetMap standard tile server (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`).
- **Zero API Keys:** Requires no third-party API keys or accounts (avoiding CARTO's watermarked tier).
- **Dark Theme:** Applies CSS filter on `.dark .leaflet-tile-pane` to gracefully invert street tiles into dark navy/slate while preserving 100% full-color marker pins and popups.

### Manual Setup Commands
```powershell
# 1. Backend
.\backend\venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
python backend/manage.py migrate
python seed_db.py
python backend/manage.py test apps
python backend/manage.py runserver 127.0.0.1:8000

# 2. Frontend
cd frontend
npm install
npm run build
npm run dev

# 3. Mobile (Expo React Native)
cd ..\mobile
npm install
npm test
npm run type-check
npm start
```
