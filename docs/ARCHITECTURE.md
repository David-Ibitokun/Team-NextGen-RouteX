# RouteX — Project Architecture

## 1. Architecture goals
Keep the MVP easy to run, safe to extend, and focused on a working reporting flow. Separate the web client, API, and database. Keep optional services such as Gemini outside the critical path.

## 2. High-level architecture

```text
Current Production Architecture
Browser / Web PWA
  React 18 + Vite 6 + Tailwind CSS v4
  React Leaflet + OSM tiles (zero-API-key)
  Axios with CSRF & Session interceptors
  NotificationBell, live Toasts, & AI Assistants
            |
Mobile Client (iOS & Android)
  Expo React Native + TypeScript
  NativeMapScreen, reporting flows, & modals
  expo-location (10km Proximity) & push alerts
            | HTTPS / JSON / multipart uploads
            v
Django REST Framework API (v1)
  Authentication + RBAC permissions
  Hazard reporting + confirmations + flags + 10km radius
  Moderation + audit history
  Google Gemini AI Service Adapter (server-side only)
  Full-Stack Notification Service & Expo Push Gateway
            | ORM
            v
PostgreSQL / SQLite + configured media storage
```

The browser can request map tiles from a configured provider. Follow the selected provider's attribution, caching, and usage policy. Do not assume public OpenStreetMap tile servers are an unlimited production tile service.

## 3. Suggested repository structure

```text
RouteX/
├── PLAN.md
├── BRAND.md
├── VOICE.md
├── BACKLOG.md
├── SESSIONS.md
├── ARCHITECTURE.md
├── STYLE.md
├── IDE_SETUP_PROMPT.md
├── README.md
├── DOCUMENTATION.md
├── run_all.bat
├── run_backend.bat
├── run_frontend.bat
├── run_mobile.bat
├── test_backend.bat
├── .gitignore
├── .env.example
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── app/router.jsx
│       ├── components/ (layout, map, hazards, forms, notifications)
│       ├── context/ (AuthContext, ThemeContext, NotificationContext)
│       ├── pages/ (Landing, Map, Report, Auth, Dashboards, Moderation)
│       └── services/ (apiClient, aiService, notificationService)
├── mobile/
│   ├── src/
│   │   ├── components/ (NativeMapScreen, ReportScreenNative, NotificationsModalNative)
│   │   ├── services/ (apiClient, hazardService, notificationService, aiService)
│   │   └── context/ (AuthContext, ThemeContext)
│   ├── scripts/ (automated mobile policy and API tests)
│   └── App.tsx
└── backend/
    ├── manage.py
    ├── config/ (settings, urls, asgi)
    └── apps/
        ├── accounts/ (UserProfile, RBAC, Admin views, audit logs)
        ├── hazards/ (HazardReport, Confirmation, 10km proximity search)
        ├── moderation/ (ModerationAction, flags queue)
        ├── ai_assistant/ (Gemini category suggestion, enhancer, summarizer, duplicate check)
        ├── notifications/ (Notification, DevicePushToken, Expo push gateway)
        └── common/
```

Adapt this layout to the real repository. Do not generate duplicate folders or rewrite a working layout just to match this example exactly.

## 4. Main domain entities
- **User/Profile:** identity, display name, and role. Enforce roles on the server.
- **HazardReport:** category, description, coordinates, created/updated timestamps, status, reporter, confirmations, flags, and optional location label. Supports 10km proximity radius calculation.
- **HazardPhoto/Evidence:** file reference and upload metadata associated with a report.
- **Confirmation:** user, report, confirmation type, and timestamp; auto-confirms reports at threshold of 3 confirmations.
- **Flag:** report, reporter, reason, status, and timestamps.
- **ModerationAction:** moderator, report, action, reason, timestamp, and audit details.
- **Notification:** recipient, sender, event type (`hazard_reported`, `hazard_confirmed`, `status_changed`, `hazard_flagged`, `safety_advisory`, `system`), title, body, target hazard, read state, and metadata.
- **DevicePushToken:** user, Expo push token, platform, and active status for push delivery.

Suggested categories: `flooding`, `pothole`, `blocked_road`, `fallen_tree`, `other`. Suggested statuses: `reported`, `under_review`, `community_confirmed`, `resolved`, `rejected`.

## 5. API design
Use a versioned prefix such as `/api/v1/`.

Core endpoints:
- `GET /hazards/` — paginated list with category, status, bounding box, and 10km proximity filters (`?lat=..&lng=..&radius_km=10`).
- `GET /hazards/{id}/` — report details.
- `POST /hazards/` — create a report; support multipart form data for a photo.
- `POST /hazards/{id}/confirm/` — confirm current presence.
- `POST /hazards/{id}/flags/` — flag a report for review.
- `POST /ai/suggest-category/` — Gemini category recommendation.
- `POST /ai/improve-description/` — Gemini grammar/clarity enhancement.
- `POST /ai/summarize-report/` — Gemini neutral incident summary for moderators.
- `POST /ai/check-duplicates/` — Hybrid geospatial + temporal + Gemini duplicate scanner.
- `GET /notifications/` — paginated user notification inbox.
- `GET /notifications/unread-count/` — live unread badge count.
- `PATCH /notifications/{id}/read/` — mark notification as read.
- `POST /notifications/mark-all-read/` — mark all as read.
- `POST /notifications/devices/` — register mobile push token.
- `POST /notifications/broadcast/` — staff safety advisory broadcast.
- `GET /me/reports/` — current user's reports.
- `POST /auth/...` — authentication endpoints.
- `GET /moderation/reports/` — moderator-only queue.
- `POST /moderation/reports/{id}/action/` — moderator-only action with reason and audit event.

Use DRF serializers, pagination, permission classes, throttling where appropriate, and consistent error responses. Never expose stack traces or secret values to clients.

## 6. Map behaviour
- Request reports for the current visible map bounds; debounce viewport changes and ignore stale responses.
- Add marker clustering if the amount of data makes it useful.
- Use distinctive category icons and text, not colour alone.
- Details should show timestamp, freshness, status, and confirmation context.
- If geolocation is denied or unavailable, let the user set a pin manually.
- Mark seeded data visibly as demo data across map, cards, and detail views.
- Preserve required tile attribution and comply with the provider's usage policy.

## 7. Security and privacy
- Keep Django secret keys, database credentials, storage credentials, and Gemini API keys in backend environment variables or a suitable secret manager.
- Never expose secret credentials in frontend bundles, `VITE_*` variables, Git, or logs.
- Restrict CORS to known origins in production and configure CSRF/secure cookies as required by the chosen auth design.
- Validate coordinates, text sizes, categories, file types, file sizes, and permissions on the server.
- Protect moderation actions with role checks and audit history.
- Apply sensible throttling to reporting, confirmation, flagging, and AI endpoints.
- **Location & Background Tracking:** Geolocation requested only on-demand (foreground) for the 10km proximity filter and map pin placement. Zero background location tracking.
- **Client-Side EXIF/GPS Scrubbing:** Images are converted to WebP via HTML5 canvas, effectively eliminating camera models, timestamps, and GPS coordinates before network upload.
- **AI Data Isolation:** Google Gemini receives only raw hazard description text; no usernames, emails, user IDs, or IPs are transmitted.
- **Self-Service Erasure & Anonymization:** Users can delete their account at `POST /api/v1/auth/delete-account/`. `User` and `UserProfile` are permanently destroyed; hazard markers remain to keep roads safe for fellow commuters, but are permanently anonymized (`reporter=NULL`).
- **Dedicated Privacy Policy & Terms:** Fully accessible at `/privacy` and `/terms` on the web, and natively in mobile `InfoScreenNative`. In-form privacy micro-notices remind users before reporting or creating an account. Official contact: `privacy@routex.org`.

## 8. Future phase: Google Gemini AI
- Call Google Gemini from the Django backend through a small adapter/service module.
- Gate it with an environment setting such as `GEMINI_AI_ENABLED`; core app behaviour must continue when disabled.
- Possible uses: suggested hazard category, a concise neutral summary, and a hint that a new report may duplicate an existing report.
- Validate the response against allowed categories and output length limits. Treat model output as untrusted.
- Require users to review suggestions before submission. Moderators and documented business rules control status changes.
- Never let the model alone label a hazard true, verified, resolved, or official.
- Handle missing key, provider timeout, rate/quota limits, malformed output, and unavailable service gracefully.
- Minimise personal information sent to the model. Document data handling, user disclosure, limits, and quota/cost assumptions.

## 9. Future phase: React Native + Expo
- Create a separate mobile client only after validating the responsive web MVP and identifying a native-specific need.
- Reuse the same versioned Django API, authentication rules, response contracts, and domain logic. Do not copy backend business rules into the app as the source of truth.
- Reuse brand tokens and terminology, but create native UI components rather than trying to reuse web DOM/Tailwind components directly.
- Evaluate a React Native map library, camera/photo capture, foreground location, push notifications, and offline draft handling.
- Request each device permission in context, explain its purpose, and handle denial gracefully. Do not introduce background location tracking without a separate justified requirement.
- Document Android setup first if that is the pilot priority, then assess iOS requirements. Verify both on real devices.

## 10. Operations and environments
- Provide `.env.example` placeholders only, never real credentials.
- Use PostgreSQL through environment-based settings and document local development setup.
- Include migrations, useful test fixtures, and a deliberate demo-data command if needed.
- Configure production debug mode, allowed hosts, HTTPS, secure cookies, static/media storage, logging, backups, CORS, and CSRF explicitly.
- Document frontend and backend commands separately and record tests actually executed.
