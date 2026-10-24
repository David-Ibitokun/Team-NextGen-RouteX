# RouteX — Backlog

> Work on the highest-priority unfinished item first. Keep this queue short, ordered, and current.

## Now
- [x] **N1 — Inspect the existing repository.** Preserved working code and identified what exists before editing.
- [x] **N2 — Establish the foundation.** React + Vite + Tailwind frontend, Django REST Framework backend, PostgreSQL configuration with local fallback, environment examples (`.env.example`), active local `.env`, `.gitignore`, and root setup documentation.
- [x] **N3 — Build the first vertical slice.** Fetch hazard reports from the API, display them on a Leaflet map with a configured initial center and OpenStreetMap attribution, filter by category/status, and open report details view.
- [x] **N4 — Implement hazard submission.** Category, description, selected coordinates (interactive map picker / geolocation fallback), optional photo, server-side validation, and complete loading/error/success states.
- [x] **N5 — Add baseline tests and security checks.** Validated coordinates (-90..90, -180..180), text limits, and upload constraints; tested API permissions, filters, confirm, flag, and core report endpoints (16 tests passing in 0.5s).
- [x] **N6 — Build Premium RouteX Landing Page.** Delivered production-quality public homepage at `/` with responsive header, live map preview hero, trust strip, 3-step workflow, feature showcase, interactive category cards, safety & trust guidelines, lower CTA, and 7-item FAQ accordion.
- [x] **N7 — Implement Session Authentication & Permissions.** Built Django session-backed registration, login, logout, me, CSRF token bootstrap, rate throttling, and React AuthContext.
- [x] **N8 — Implement Moderation Review Queue & History.** Created role-based moderation endpoints (`GET /api/v1/moderation/reports/`, `POST /api/v1/moderation/reports/<id>/action/`), audit history logging, and Moderator review dashboard UI.
- [x] **N9 — Implement My Reports User Dashboard.** Built `/my-reports` screen showing user submissions, timestamps, freshness, confirmation counts, and map links.
- [x] **N10 — Enforce Confirmation Threshold & Duplicate Safeguards.** Unique constraints and backend checks prevent repeated confirmations/flags; auto-transitions reports to `community_confirmed` upon reaching 3 distinct confirmations.
- [x] **N11 — Implement "Hazards Near You" (10 km Proximity Radius).** Delivered bounding box pre-filtering + spherical Haversine distance calculations in backend (`?lat=..&lng=..&radius_km=10`), web "Near Me" toggle with Leaflet 10km circle visualizer, and mobile `expo-location` GPS tracking.
- [x] **N12 — Proactive AI Duplicate Detection & 1-Click Confirmation.** Real-time debounced (1.2s) auto-scan on draft description + coords, candidate cards with AI similarity rationale, 1-click "Confirm Existing Hazard" button, and pre-submission confirmation alerts across web and mobile.
- [x] **N13 — Full-Stack Notification System.** Persistent `Notification` & `DevicePushToken` models, event triggers on hazard lifecycle, Expo push notification gateway, web `NotificationBell` with unread badge counter, live `ToastNotification` banner, and mobile hybrid sync.

## Next
- [ ] Add marker clustering on `/map` for very dense hazard clusters across supported regions.
- [ ] Add photo full-screen lightbox modal for high-resolution photographic evidence inspection.
- [ ] Implement email verification workflow for accounts upon public launch.

## Done — Google Gemini AI (Phase 2 Delivered)
- [x] Create a backend-only AI service adapter (`GeminiService`) and feature flag (`GEMINI_AI_ENABLED`).
- [x] Use Google Gemini API to suggest hazard categories (`flooding`, `pothole`, `blocked_road`, `fallen_tree`, `other`) and produce concise neutral summaries.
- [x] Implement hybrid duplicate-report detector: deterministic Haversine distance ($\le 1\text{km}$) + time window ($\le 48\text{h}$) pre-filtering + Gemini semantic comparison.
- [x] Validate AI output against allowed categories and text limits; treat user text and AI outputs as untrusted data.
- [x] Handle missing API keys, quota limits, timeouts (10s), invalid output, and provider outages gracefully with controlled 503/504 responses without breaking core reporting.
- [x] Deliver frontend AI assistant components: `AISuggestionCard`, "Suggest Category" pill, "Refine wording" drawer, and moderator incident summary & duplicate scanner.
- [x] Enforce human-in-the-loop: AI alone never verifies, resolves, rejects, or publishes reports.

## Done — React Native mobile (Native Capabilities Phase)
- [x] Create Expo React Native mobile container (`mobile/`) with brand tokens and security boundaries.
- [x] Implement native screens: `NativeMapScreen`, `ReportScreenNative`, `ReportModalNative`, `NotificationsModalNative`, and `HazardCardNative`.
- [x] Integrate `expo-location` for 10km "Near Me" proximity filtering.
- [x] Integrate Expo Push Notifications channel setup and device token registration.
- [x] Connect mobile direct REST API client with cookie and session extraction.
- [x] Automated mobile unit and security policy test suites (15/15 passing).

## Later — scale and expansion
- [ ] Evaluate deployment, monitoring, backups, media storage, and abuse-report workflows before a public launch.
- [ ] Expand to additional regions after the initial service has reliable data and moderation.

## Done
- [x] **N14 — Data Privacy, Terms of Service & Privacy Transparency Disclosures:** Implemented comprehensive `/privacy` & `/terms` route, mobile native `InfoScreenNative` privacy view, in-form privacy notices on `ReportHazardForm` & `ReportScreenNative`, registration consent on `RegisterPage` & `AuthModalNative`, EXIF metadata stripping, and self-service account deletion transparency.
- [x] **N11 — Initial Mobile Application (Expo React Native Shell):** Created `mobile/` app with Expo SDK 58, TypeScript, `react-native-webview`, safe area provider, RouteX branding, navigation policy, and error recovery.
- [x] Team name selected: NextGen.
- [x] Product name selected: RouteX.
- [x] Tagline selected: “Know the Road Ahead.”
- [x] Initial stack selected: React + Vite + Tailwind CSS, Django REST Framework, PostgreSQL, Leaflet.
- [x] MVP defined as a responsive web app; AI and React Native are future phases.
- [x] Repository inspected; isolated Git repository initialized.
- [x] Environment files established (`.env.example` and local `.env` with SQLite fallback and PostgreSQL settings).
- [x] Backend established: Django 5.1 + DRF with `accounts`, `hazards`, `moderation`, and `common` apps.
- [x] Backend database migrations executed and verified.
- [x] 16 unit and API tests written and passed (100% pass rate in 0.5s).
- [x] Realistic demo hazards seeding command created (`seed_demo_hazards`).
- [x] Frontend established: React 18 + Vite 6 + Tailwind CSS v4 (`@tailwindcss/vite`) + React Leaflet.
- [x] Production Landing Page at `/` with all 11 required sections, responsive mobile drawer, GPU-accelerated scroll reveal animations (`RevealOnScroll`), and dynamic live map preview.
- [x] Generalize project scope to universal community road awareness across both frontend and backend.
- [x] Pure Lucide React iconography utilized across all components.
- [x] Four account types with server-enforced RBAC permissions: Anonymous Visitor, Registered Citizen, Moderator, and Platform Administrator.
- [x] Three dedicated custom frontend dashboards: Citizen Commuter Dashboard (`/dashboard`), Moderator Queue (`/moderator`), and Platform Administrator Portal (`/admin-dashboard`). Zero reliance on Django built-in admin.
- [x] Live operational settings API (`PlatformSettings`): auto-confirm threshold, freshness window, upload ceiling.
- [x] Progressive Web App (PWA): manifest, service worker caching, install prompt UI, and offline shell support.
- [x] Landing Page enhancements: Live Incident Stream, Emergency Advisory, Citizen Safety Pledge, and Native PWA showcase banner.
- [x] 28 unit and integration tests passing with 100% success rate (`python backend/manage.py test apps`).

## Decisions / blockers
- [x] Threshold defined: 3 distinct community confirmations auto-transition report from `reported` to `community_confirmed`.
- [x] Write actions require sign-in: authenticated users submit reports, confirmations, and flags. Anonymous users can browse map, inspect details, and read documentation freely.
- [x] Choose cloud deployment: Deployed frontend on Vercel (https://team-next-gen-route-x.vercel.app/) and backend on Heroku (https://routex-api-bcfe83a1907c.herokuapp.com/).
