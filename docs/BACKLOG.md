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

## Next
- [ ] Add marker clustering on `/map` for very dense hazard clusters across supported regions.
- [ ] Add photo full-screen lightbox modal for high-resolution photographic evidence inspection.
- [ ] Add PWA (Progressive Web App) manifest and service worker for offline shell caching.
- [ ] Implement email verification workflow for accounts upon public launch.

## Later — Google Gemini AI
- [ ] Create a backend-only AI service adapter and feature flag (for example, `GEMINI_AI_ENABLED`).
- [ ] Use the Google Gemini API to suggest a hazard category from a report description and optionally produce a concise, neutral summary.
- [ ] Consider duplicate-report hints based on text plus time/location signals, but keep deterministic checks and user/moderator review in control.
- [ ] Validate AI output against allowed categories and text limits; treat it as untrusted input.
- [ ] Handle missing API keys, quota limits, timeouts, invalid output, and provider outages without breaking core reporting.
- [ ] Document cost/quota assumptions and never promise a permanently free quota.
- [ ] Do not send unnecessary personal data to the model, and do not allow AI alone to mark a report verified, true, resolved, or official.

## Later — React Native mobile
- [ ] Reassess mobile requirements after the responsive web MVP is stable.
- [ ] If justified, create a separate React Native + Expo app using the existing Django API.
- [ ] Reuse API contracts, validation rules, brand tokens, and terminology; do not assume web components can be reused directly.
- [ ] Evaluate native maps, camera/photo capture, foreground location, push notifications, and offline draft support.
- [ ] Ask for permissions only when the associated feature is used; avoid background tracking unless a future, explicit product requirement justifies it.
- [ ] Test on real Android devices and document iOS requirements if iOS support is pursued.

## Later — scale and expansion
- [ ] Evaluate deployment, monitoring, backups, media storage, and abuse-report workflows before a public launch.
- [ ] Expand to additional regions after the initial service has reliable data and moderation.

## Done
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
- [ ] Choose cloud deployment (Render, Fly.io, or Railway) and media-storage provider (AWS S3 or Cloudinary) for public demonstration.
